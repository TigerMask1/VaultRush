import { pool } from '../database/db';

export async function playCoinFlip(userId: string, betAmount: number, choice: 'heads' | 'tails') {
    const user = await pool.query(`SELECT coins FROM users WHERE discord_id = $1`, [userId]);
    
    if (user.rows.length === 0 || user.rows[0].coins < betAmount) {
        return { success: false, message: 'Insufficient coins' };
    }
    
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === choice;
    const winAmount = won ? betAmount : -betAmount;
    
    await pool.query(
        `UPDATE users 
         SET coins = coins + $1,
             ${won ? 'total_earned = total_earned + $2' : 'total_spent = total_spent + $2'}
         WHERE discord_id = $3`,
        [winAmount, Math.abs(winAmount), userId]
    );
    
    await pool.query(
        `INSERT INTO transactions (user_id, transaction_type, amount, description)
         VALUES ($1, 'coinflip', $2, $3)`,
        [userId, winAmount, `Coin flip - ${won ? 'won' : 'lost'}`]
    );
    
    return {
        success: true,
        won,
        result,
        winAmount: Math.abs(winAmount),
        newBalance: user.rows[0].coins + winAmount
    };
}

export async function attemptVaultRaid(attackerId: string, targetId: string) {
    if (attackerId === targetId) {
        return { success: false, message: 'You cannot raid your own vault!' };
    }
    
    const attacker = await pool.query(`SELECT * FROM users WHERE discord_id = $1`, [attackerId]);
    const target = await pool.query(`SELECT * FROM users WHERE discord_id = $1`, [targetId]);
    
    if (attacker.rows.length === 0 || target.rows.length === 0) {
        return { success: false, message: 'Player not found' };
    }
    
    const raidCost = 500;
    if (attacker.rows[0].coins < raidCost) {
        return { success: false, message: `Raid costs ${raidCost} coins` };
    }
    
    const attackerArtifacts = await pool.query(
        `SELECT COUNT(*) as count FROM artifacts WHERE owner_id = $1`,
        [attackerId]
    );
    
    const targetArtifacts = await pool.query(
        `SELECT COUNT(*) as count FROM artifacts WHERE owner_id = $1`,
        [targetId]
    );
    
    const attackerBonus = parseInt(attackerArtifacts.rows[0].count) * 0.05;
    const defenseBonus = parseInt(targetArtifacts.rows[0].count) * 0.03;
    
    const baseSuccessChance = 0.4;
    const successChance = baseSuccessChance + attackerBonus - defenseBonus;
    
    const success = Math.random() < successChance;
    
    await pool.query(
        `UPDATE users SET coins = coins - $1 WHERE discord_id = $2`,
        [raidCost, attackerId]
    );
    
    if (success) {
        const stolenAmount = Math.floor(target.rows[0].coins * 0.15);
        
        await pool.query(
            `UPDATE users SET coins = coins - $1 WHERE discord_id = $2`,
            [stolenAmount, targetId]
        );
        
        await pool.query(
            `UPDATE users SET coins = coins + $1 WHERE discord_id = $2`,
            [stolenAmount, attackerId]
        );
        
        await pool.query(
            `INSERT INTO transactions (user_id, transaction_type, amount, description)
             VALUES ($1, 'raid_success', $2, 'Successful vault raid')`,
            [attackerId, stolenAmount]
        );
        
        return {
            success: true,
            won: true,
            stolenAmount,
            message: `Raid successful! You stole ${stolenAmount} coins!`
        };
    } else {
        await pool.query(
            `INSERT INTO transactions (user_id, transaction_type, amount, description)
             VALUES ($1, 'raid_failed', $2, 'Failed vault raid')`,
            [attackerId, raidCost]
        );
        
        return {
            success: true,
            won: false,
            message: `Raid failed! You lost ${raidCost} coins.`
        };
    }
}

export async function openMysteryCrate(userId: string) {
    const crateCost = 1000;
    
    const user = await pool.query(`SELECT coins FROM users WHERE discord_id = $1`, [userId]);
    
    if (user.rows.length === 0 || user.rows[0].coins < crateCost) {
        return { success: false, message: 'Insufficient coins (costs 1000 coins)' };
    }
    
    await pool.query(
        `UPDATE users SET coins = coins - $1, total_spent = total_spent + $1 WHERE discord_id = $2`,
        [crateCost, userId]
    );
    
    const roll = Math.random();
    let reward;
    
    if (roll < 0.60) {
        const coinReward = Math.floor(Math.random() * 1000) + 500;
        await pool.query(
            `UPDATE users SET coins = coins + $1, total_earned = total_earned + $1 WHERE discord_id = $2`,
            [coinReward, userId]
        );
        reward = { type: 'coins', amount: coinReward };
    } else if (roll < 0.90) {
        const tokenReward = Math.floor(Math.random() * 5) + 1;
        await pool.query(
            `UPDATE users SET vault_tokens = vault_tokens + $1 WHERE discord_id = $2`,
            [tokenReward, userId]
        );
        reward = { type: 'tokens', amount: tokenReward };
    } else {
        const { generateRandomArtifact } = require('./artifacts');
        const artifact = await generateRandomArtifact(userId, 'mystery_crate');
        reward = { type: 'artifact', artifact };
    }
    
    return { success: true, reward };
}
