import { pool } from '../database/db';

export async function createMarketOrder(userId: string, orderType: 'buy' | 'sell', tokens: number, pricePerToken: number) {
    const user = await pool.query(`SELECT * FROM users WHERE discord_id = $1`, [userId]);
    
    if (user.rows.length === 0) {
        return { success: false, message: 'User not found' };
    }
    
    if (orderType === 'buy') {
        const totalCost = tokens * pricePerToken;
        if (user.rows[0].coins < totalCost) {
            return { success: false, message: 'Insufficient coins' };
        }
        
        await pool.query(
            `UPDATE users SET coins = coins - $1 WHERE discord_id = $2`,
            [totalCost, userId]
        );
    } else {
        if (user.rows[0].vault_tokens < tokens) {
            return { success: false, message: 'Insufficient tokens' };
        }
        
        await pool.query(
            `UPDATE users SET vault_tokens = vault_tokens - $1 WHERE discord_id = $2`,
            [tokens, userId]
        );
    }
    
    const result = await pool.query(
        `INSERT INTO market_orders (user_id, order_type, tokens, price_per_token)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, orderType, tokens, pricePerToken]
    );
    
    await matchOrders();
    
    return { success: true, order: result.rows[0] };
}

export async function matchOrders() {
    const buyOrders = await pool.query(
        `SELECT * FROM market_orders 
         WHERE order_type = 'buy' AND status = 'active' AND filled < tokens
         ORDER BY price_per_token DESC, created_at ASC`
    );
    
    const sellOrders = await pool.query(
        `SELECT * FROM market_orders 
         WHERE order_type = 'sell' AND status = 'active' AND filled < tokens
         ORDER BY price_per_token ASC, created_at ASC`
    );
    
    for (const buyOrder of buyOrders.rows) {
        for (const sellOrder of sellOrders.rows) {
            if (buyOrder.price_per_token >= sellOrder.price_per_token) {
                const buyRemaining = buyOrder.tokens - buyOrder.filled;
                const sellRemaining = sellOrder.tokens - sellOrder.filled;
                const matchedTokens = Math.min(buyRemaining, sellRemaining);
                const tradePrice = sellOrder.price_per_token;
                
                await pool.query(
                    `UPDATE users SET vault_tokens = vault_tokens + $1 WHERE discord_id = $2`,
                    [matchedTokens, buyOrder.user_id]
                );
                
                await pool.query(
                    `UPDATE users SET coins = coins + $1 WHERE discord_id = $2`,
                    [matchedTokens * tradePrice, sellOrder.user_id]
                );
                
                await pool.query(
                    `UPDATE market_orders SET filled = filled + $1 WHERE id = $2`,
                    [matchedTokens, buyOrder.id]
                );
                
                await pool.query(
                    `UPDATE market_orders SET filled = filled + $1 WHERE id = $2`,
                    [matchedTokens, sellOrder.id]
                );
                
                if (buyOrder.filled + matchedTokens >= buyOrder.tokens) {
                    await pool.query(`UPDATE market_orders SET status = 'completed' WHERE id = $1`, [buyOrder.id]);
                }
                
                if (sellOrder.filled + matchedTokens >= sellOrder.tokens) {
                    await pool.query(`UPDATE market_orders SET status = 'completed' WHERE id = $1`, [sellOrder.id]);
                }
                
                await updateMarketPrice(tradePrice);
            }
        }
    }
}

export async function updateMarketPrice(lastTradePrice: number) {
    await pool.query(
        `UPDATE game_stats SET token_market_price = $1, updated_at = CURRENT_TIMESTAMP`,
        [lastTradePrice]
    );
}

export async function getMarketStats() {
    const stats = await pool.query(`SELECT * FROM game_stats LIMIT 1`);
    const activeOrders = await pool.query(
        `SELECT order_type, COUNT(*) as count, SUM(tokens - filled) as total_tokens
         FROM market_orders 
         WHERE status = 'active'
         GROUP BY order_type`
    );
    
    return {
        marketPrice: stats.rows[0]?.token_market_price || 100,
        activeOrders: activeOrders.rows
    };
}
