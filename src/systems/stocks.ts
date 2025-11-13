import { pool } from '../database/db';

export async function createVaultStock(userId: string, username: string) {
    const userCheck = await pool.query(
        'SELECT * FROM vault_stocks WHERE vault_owner_id = $1',
        [userId]
    );
    
    if (userCheck.rows.length > 0) {
        return { success: false, message: 'You already have a stock listed!' };
    }
    
    const userInfo = await pool.query(
        'SELECT coins, vault_level, coins_per_hour FROM users WHERE discord_id = $1',
        [userId]
    );
    
    if (userInfo.rows.length === 0) {
        return { success: false, message: 'User not found! Please use /start first.' };
    }
    
    if (userInfo.rows[0].coins < 50000) {
        return { success: false, message: 'You need at least 50,000 coins to list your vault on the stock market!' };
    }
    
    const stockSymbol = username.substring(0, 4).toUpperCase() + Math.floor(Math.random() * 100);
    const companyName = `${username}'s Vault Corp`;
    
    const basePrice = Math.max(100, Math.floor(userInfo.rows[0].coins_per_hour * 2));
    
    const result = await pool.query(
        `INSERT INTO vault_stocks (vault_owner_id, stock_symbol, company_name, current_price, market_cap, performance_score)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, stockSymbol, companyName, basePrice, basePrice * 10000, 1.0]
    );
    
    return { success: true, stock: result.rows[0] };
}

export async function buyShares(buyerId: string, stockSymbol: string, quantity: number) {
    const stock = await pool.query(
        'SELECT * FROM vault_stocks WHERE stock_symbol = $1 AND is_public = true',
        [stockSymbol]
    );
    
    if (stock.rows.length === 0) {
        return { success: false, message: 'Stock not found or not available for trading!' };
    }
    
    const stockData = stock.rows[0];
    
    if (stockData.vault_owner_id === buyerId) {
        return { success: false, message: 'You cannot buy shares of your own vault!' };
    }
    
    if (quantity > stockData.shares_available) {
        return { success: false, message: `Only ${stockData.shares_available} shares available!` };
    }
    
    const totalCost = stockData.current_price * quantity;
    
    const buyerCoins = await pool.query(
        'SELECT coins FROM users WHERE discord_id = $1',
        [buyerId]
    );
    
    if (buyerCoins.rows[0].coins < totalCost) {
        return { success: false, message: `Insufficient funds! Cost: ${totalCost.toLocaleString()} coins` };
    }
    
    await pool.query('BEGIN');
    
    try {
        await pool.query(
            'UPDATE users SET coins = coins - $1 WHERE discord_id = $2',
            [totalCost, buyerId]
        );
        
        await pool.query(
            'UPDATE users SET coins = coins + $1 WHERE discord_id = $2',
            [totalCost, stockData.vault_owner_id]
        );
        
        await pool.query(
            'UPDATE vault_stocks SET shares_available = shares_available - $1 WHERE id = $2',
            [quantity, stockData.id]
        );
        
        const existingHolding = await pool.query(
            'SELECT * FROM stock_holdings WHERE stock_id = $1 AND holder_id = $2',
            [stockData.id, buyerId]
        );
        
        if (existingHolding.rows.length > 0) {
            const currentShares = existingHolding.rows[0].shares_owned;
            const currentInvestment = existingHolding.rows[0].total_invested;
            const newTotalInvestment = currentInvestment + totalCost;
            const newTotalShares = currentShares + quantity;
            const newAvgPrice = Math.floor(newTotalInvestment / newTotalShares);
            
            await pool.query(
                `UPDATE stock_holdings 
                 SET shares_owned = shares_owned + $1, 
                     total_invested = total_invested + $2,
                     average_buy_price = $3,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE stock_id = $4 AND holder_id = $5`,
                [quantity, totalCost, newAvgPrice, stockData.id, buyerId]
            );
        } else {
            await pool.query(
                `INSERT INTO stock_holdings (stock_id, holder_id, shares_owned, average_buy_price, total_invested)
                 VALUES ($1, $2, $3, $4, $5)`,
                [stockData.id, buyerId, quantity, stockData.current_price, totalCost]
            );
        }
        
        await pool.query(
            `INSERT INTO stock_transactions (stock_id, user_id, transaction_type, shares, price_per_share, total_amount)
             VALUES ($1, $2, 'buy', $3, $4, $5)`,
            [stockData.id, buyerId, quantity, stockData.current_price, totalCost]
        );
        
        const priceIncrease = Math.floor(stockData.current_price * 0.02 * (quantity / 100));
        await pool.query(
            'UPDATE vault_stocks SET current_price = current_price + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [Math.max(1, priceIncrease), stockData.id]
        );
        
        await pool.query('COMMIT');
        
        return { 
            success: true, 
            totalCost, 
            quantity,
            pricePerShare: stockData.current_price,
            stockSymbol: stockData.stock_symbol
        };
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error buying shares:', error);
        return { success: false, message: 'Transaction failed!' };
    }
}

export async function sellShares(sellerId: string, stockSymbol: string, quantity: number) {
    const stock = await pool.query(
        'SELECT * FROM vault_stocks WHERE stock_symbol = $1',
        [stockSymbol]
    );
    
    if (stock.rows.length === 0) {
        return { success: false, message: 'Stock not found!' };
    }
    
    const stockData = stock.rows[0];
    
    const holding = await pool.query(
        'SELECT * FROM stock_holdings WHERE stock_id = $1 AND holder_id = $2',
        [stockData.id, sellerId]
    );
    
    if (holding.rows.length === 0 || holding.rows[0].shares_owned < quantity) {
        return { success: false, message: 'You don\'t have enough shares to sell!' };
    }
    
    const totalValue = stockData.current_price * quantity;
    
    const ownerBalance = await pool.query(
        'SELECT coins FROM users WHERE discord_id = $1',
        [stockData.vault_owner_id]
    );
    
    const buybackCost = Math.floor(totalValue * 0.95);
    
    if (ownerBalance.rows[0].coins < buybackCost) {
        return { success: false, message: 'Vault owner has insufficient funds to buy back shares! Cannot sell at this time.' };
    }
    
    await pool.query('BEGIN');
    
    try {
        await pool.query(
            'UPDATE users SET coins = coins + $1 WHERE discord_id = $2',
            [buybackCost, sellerId]
        );
        
        await pool.query(
            'UPDATE users SET coins = coins - $1 WHERE discord_id = $2',
            [buybackCost, stockData.vault_owner_id]
        );
        
        await pool.query(
            'UPDATE vault_stocks SET shares_available = shares_available + $1 WHERE id = $2',
            [quantity, stockData.id]
        );
        
        const newSharesOwned = holding.rows[0].shares_owned - quantity;
        
        if (newSharesOwned === 0) {
            await pool.query(
                'DELETE FROM stock_holdings WHERE stock_id = $1 AND holder_id = $2',
                [stockData.id, sellerId]
            );
        } else {
            const proportionSold = quantity / holding.rows[0].shares_owned;
            const investmentSold = Math.floor(holding.rows[0].total_invested * proportionSold);
            
            await pool.query(
                `UPDATE stock_holdings 
                 SET shares_owned = shares_owned - $1, 
                     total_invested = total_invested - $2,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE stock_id = $3 AND holder_id = $4`,
                [quantity, investmentSold, stockData.id, sellerId]
            );
        }
        
        await pool.query(
            `INSERT INTO stock_transactions (stock_id, user_id, transaction_type, shares, price_per_share, total_amount)
             VALUES ($1, $2, 'sell', $3, $4, $5)`,
            [stockData.id, sellerId, quantity, stockData.current_price, totalValue]
        );
        
        const priceDecrease = Math.floor(stockData.current_price * 0.02 * (quantity / 100));
        await pool.query(
            'UPDATE vault_stocks SET current_price = GREATEST(10, current_price - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [Math.max(1, priceDecrease), stockData.id]
        );
        
        await pool.query('COMMIT');
        
        const profit = buybackCost - (holding.rows[0].average_buy_price * quantity);
        
        return { 
            success: true, 
            totalValue: buybackCost, 
            quantity,
            pricePerShare: stockData.current_price,
            stockSymbol: stockData.stock_symbol,
            profit
        };
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error selling shares:', error);
        return { success: false, message: 'Transaction failed!' };
    }
}

export async function getStockMarketInfo() {
    const stocks = await pool.query(
        `SELECT vs.*, u.username as owner_name, u.coins_per_hour, u.vault_level,
                (vs.total_shares - vs.shares_available) as shares_sold
         FROM vault_stocks vs
         JOIN users u ON vs.vault_owner_id = u.discord_id
         WHERE vs.is_public = true
         ORDER BY vs.market_cap DESC
         LIMIT 20`
    );
    
    return stocks.rows;
}

export async function getStockInfo(stockSymbol: string) {
    const stock = await pool.query(
        `SELECT vs.*, u.username as owner_name, u.coins_per_hour, u.vault_level, u.coins,
                (vs.total_shares - vs.shares_available) as shares_sold
         FROM vault_stocks vs
         JOIN users u ON vs.vault_owner_id = u.discord_id
         WHERE vs.stock_symbol = $1`,
        [stockSymbol]
    );
    
    if (stock.rows.length === 0) {
        return null;
    }
    
    const recentTransactions = await pool.query(
        `SELECT transaction_type, shares, price_per_share, created_at
         FROM stock_transactions
         WHERE stock_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [stock.rows[0].id]
    );
    
    return {
        ...stock.rows[0],
        recentTransactions: recentTransactions.rows
    };
}

export async function getUserPortfolio(userId: string) {
    const holdings = await pool.query(
        `SELECT sh.*, vs.stock_symbol, vs.company_name, vs.current_price,
                (sh.shares_owned * vs.current_price) as current_value,
                ((sh.shares_owned * vs.current_price) - sh.total_invested) as profit_loss
         FROM stock_holdings sh
         JOIN vault_stocks vs ON sh.stock_id = vs.id
         WHERE sh.holder_id = $1
         ORDER BY current_value DESC`,
        [userId]
    );
    
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalDividends = 0;
    
    for (const holding of holdings.rows) {
        totalInvested += parseInt(holding.total_invested);
        totalCurrentValue += parseInt(holding.current_value);
        totalDividends += parseInt(holding.total_dividends_earned || 0);
    }
    
    return {
        holdings: holdings.rows,
        totalInvested,
        totalCurrentValue,
        totalDividends,
        totalProfitLoss: totalCurrentValue - totalInvested
    };
}

export async function updateStockPrices() {
    const stocks = await pool.query(
        `SELECT vs.*, u.coins_per_hour, u.vault_level, u.total_earned
         FROM vault_stocks vs
         JOIN users u ON vs.vault_owner_id = u.discord_id
         WHERE vs.is_public = true`
    );
    
    for (const stock of stocks.rows) {
        const performanceScore = (stock.coins_per_hour / 100) * (1 + stock.vault_level * 0.1);
        const randomFluctuation = (Math.random() - 0.5) * 0.1;
        const priceChange = stock.current_price * (performanceScore * 0.01 + randomFluctuation);
        
        const newPrice = Math.max(10, Math.floor(stock.current_price + priceChange));
        const priceChange24h = ((newPrice - stock.current_price) / stock.current_price) * 100;
        
        await pool.query(
            `UPDATE vault_stocks 
             SET current_price = $1, 
                 price_change_24h = $2,
                 market_cap = $1 * total_shares,
                 performance_score = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [newPrice, priceChange24h, performanceScore, stock.id]
        );
    }
}

export async function payDividends() {
    const stocks = await pool.query(
        `SELECT * FROM vault_stocks 
         WHERE is_public = true 
         AND last_dividend_payout < NOW() - INTERVAL '24 hours'`
    );
    
    for (const stock of stocks.rows) {
        const holders = await pool.query(
            'SELECT * FROM stock_holdings WHERE stock_id = $1 AND shares_owned > 0',
            [stock.id]
        );
        
        for (const holder of holders.rows) {
            const dividendAmount = Math.floor(holder.shares_owned * stock.dividend_rate * stock.current_price);
            
            if (dividendAmount > 0) {
                await pool.query(
                    'UPDATE users SET coins = coins + $1 WHERE discord_id = $2',
                    [dividendAmount, holder.holder_id]
                );
                
                await pool.query(
                    `UPDATE stock_holdings 
                     SET total_dividends_earned = total_dividends_earned + $1 
                     WHERE id = $2`,
                    [dividendAmount, holder.id]
                );
                
                await pool.query(
                    `INSERT INTO stock_dividends (stock_id, holder_id, amount, shares_held)
                     VALUES ($1, $2, $3, $4)`,
                    [stock.id, holder.holder_id, dividendAmount, holder.shares_owned]
                );
            }
        }
        
        await pool.query(
            'UPDATE vault_stocks SET last_dividend_payout = CURRENT_TIMESTAMP WHERE id = $1',
            [stock.id]
        );
    }
}
