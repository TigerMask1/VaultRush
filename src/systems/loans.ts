import { pool } from '../database/db';

export async function createLoan(lenderId: string, borrowerId: string, amount: number, interestRate: number = 0.1, durationDays: number = 7) {
    if (lenderId === borrowerId) {
        return { success: false, message: 'Cannot lend to yourself' };
    }
    
    const lender = await pool.query(`SELECT coins FROM users WHERE discord_id = $1`, [lenderId]);
    
    if (lender.rows.length === 0 || lender.rows[0].coins < amount) {
        return { success: false, message: 'Insufficient coins to lend' };
    }
    
    const totalOwed = Math.floor(amount * (1 + interestRate));
    const dueDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    
    await pool.query(`UPDATE users SET coins = coins - $1 WHERE discord_id = $2`, [amount, lenderId]);
    await pool.query(`UPDATE users SET coins = coins + $1 WHERE discord_id = $2`, [amount, borrowerId]);
    
    const result = await pool.query(
        `INSERT INTO loans (lender_id, borrower_id, amount, interest_rate, total_owed, due_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [lenderId, borrowerId, amount, interestRate, totalOwed, dueDate]
    );
    
    return { success: true, loan: result.rows[0] };
}

export async function repayLoan(loanId: number, borrowerId: string, paymentAmount: number) {
    const loan = await pool.query(
        `SELECT * FROM loans WHERE id = $1 AND borrower_id = $2 AND status = 'active'`,
        [loanId, borrowerId]
    );
    
    if (loan.rows.length === 0) {
        return { success: false, message: 'Loan not found or already paid' };
    }
    
    const loanData = loan.rows[0];
    const remaining = loanData.total_owed - loanData.amount_paid;
    
    if (paymentAmount > remaining) {
        paymentAmount = remaining;
    }
    
    const borrower = await pool.query(`SELECT coins FROM users WHERE discord_id = $1`, [borrowerId]);
    
    if (borrower.rows.length === 0 || borrower.rows[0].coins < paymentAmount) {
        return { success: false, message: 'Insufficient coins to repay' };
    }
    
    await pool.query(`UPDATE users SET coins = coins - $1 WHERE discord_id = $2`, [paymentAmount, borrowerId]);
    await pool.query(`UPDATE users SET coins = coins + $1 WHERE discord_id = $2`, [paymentAmount, loanData.lender_id]);
    
    const newAmountPaid = loanData.amount_paid + paymentAmount;
    const status = newAmountPaid >= loanData.total_owed ? 'completed' : 'active';
    
    await pool.query(
        `UPDATE loans SET amount_paid = $1, status = $2 WHERE id = $3`,
        [newAmountPaid, status, loanId]
    );
    
    return { success: true, paid: paymentAmount, remaining: loanData.total_owed - newAmountPaid, status };
}

export async function getUserLoans(userId: string) {
    const borrowed = await pool.query(
        `SELECT l.*, u.username as lender_name FROM loans l
         JOIN users u ON l.lender_id = u.discord_id
         WHERE l.borrower_id = $1
         ORDER BY l.created_at DESC`,
        [userId]
    );
    
    const lent = await pool.query(
        `SELECT l.*, u.username as borrower_name FROM loans l
         JOIN users u ON l.borrower_id = u.discord_id
         WHERE l.lender_id = $1
         ORDER BY l.created_at DESC`,
        [userId]
    );
    
    return { borrowed: borrowed.rows, lent: lent.rows };
}

export async function autoDeductOverdueLoans() {
    const overdueLoans = await pool.query(
        `SELECT * FROM loans WHERE status = 'active' AND due_date < CURRENT_TIMESTAMP`
    );
    
    for (const loan of overdueLoans.rows) {
        const remaining = loan.total_owed - loan.amount_paid;
        const borrower = await pool.query(`SELECT coins FROM users WHERE discord_id = $1`, [loan.borrower_id]);
        
        if (borrower.rows.length > 0) {
            const availableCoins = borrower.rows[0].coins;
            const deductAmount = Math.min(availableCoins, remaining);
            
            if (deductAmount > 0) {
                await repayLoan(loan.id, loan.borrower_id, deductAmount);
            }
        }
    }
}

export async function cancelLoan(loanId: number, lenderId: string) {
    const loan = await pool.query(
        `SELECT * FROM loans WHERE id = $1 AND lender_id = $2 AND status = 'active' AND amount_paid = 0`,
        [loanId, lenderId]
    );
    
    if (loan.rows.length === 0) {
        return { success: false, message: 'Loan not found or payment already started' };
    }
    
    const loanData = loan.rows[0];
    
    await pool.query(`UPDATE users SET coins = coins + $1 WHERE discord_id = $2`, [loanData.amount, lenderId]);
    await pool.query(`UPDATE users SET coins = coins - $1 WHERE discord_id = $2`, [loanData.amount, loanData.borrower_id]);
    await pool.query(`UPDATE loans SET status = 'cancelled' WHERE id = $1`, [loanId]);
    
    return { success: true };
}
