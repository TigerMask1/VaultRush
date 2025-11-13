import { pool, calculatePendingCoins } from '../database/db';

export async function collectCoins(userId: string): Promise<{ collected: number; newTotal: number }> {
    const pendingCoins = await calculatePendingCoins(userId);
    
    const result = await pool.query(
        `UPDATE users 
         SET coins = coins + $1, 
             last_collection = CURRENT_TIMESTAMP,
             total_earned = total_earned + $1
         WHERE discord_id = $2
         RETURNING coins`,
        [pendingCoins, userId]
    );
    
    await pool.query(
        `INSERT INTO transactions (user_id, transaction_type, amount, description)
         VALUES ($1, 'collection', $2, 'Vault coin collection')`,
        [userId, pendingCoins]
    );
    
    return {
        collected: pendingCoins,
        newTotal: result.rows[0].coins
    };
}

export async function upgradeVault(userId: string, upgradeType: 'rate' | 'speed'): Promise<{ success: boolean; cost: number; newLevel: number }> {
    const user = await pool.query(`SELECT * FROM users WHERE discord_id = $1`, [userId]);
    
    if (user.rows.length === 0) {
        return { success: false, cost: 0, newLevel: 0 };
    }
    
    const currentLevel = upgradeType === 'rate' ? user.rows[0].vault_level : user.rows[0].vault_speed_level;
    const cost = calculateUpgradeCost(currentLevel);
    
    if (user.rows[0].coins < cost) {
        return { success: false, cost, newLevel: currentLevel };
    }
    
    const column = upgradeType === 'rate' ? 'vault_level' : 'vault_speed_level';
    const newLevel = currentLevel + 1;
    
    await pool.query(
        `UPDATE users 
         SET coins = coins - $1, 
             ${column} = $2,
             ${upgradeType === 'rate' ? 'coins_per_hour = coins_per_hour + 50' : ''}
             total_spent = total_spent + $1
         WHERE discord_id = $3`,
        [cost, newLevel, userId]
    );
    
    await pool.query(
        `INSERT INTO transactions (user_id, transaction_type, amount, description)
         VALUES ($1, 'upgrade', $2, $3)`,
        [userId, cost, `Vault ${upgradeType} upgrade to level ${newLevel}`]
    );
    
    return { success: true, cost, newLevel };
}

export function calculateUpgradeCost(currentLevel: number): number {
    return Math.floor(1000 * Math.pow(1.5, currentLevel - 1));
}

export async function getVaultInfo(userId: string) {
    const pending = await calculatePendingCoins(userId);
    const user = await pool.query(`SELECT * FROM users WHERE discord_id = $1`, [userId]);
    
    if (user.rows.length === 0) return null;
    
    const userData = user.rows[0];
    const nextRateCost = calculateUpgradeCost(userData.vault_level);
    const nextSpeedCost = calculateUpgradeCost(userData.vault_speed_level);
    
    return {
        coins: userData.coins,
        pendingCoins: pending,
        vaultLevel: userData.vault_level,
        speedLevel: userData.vault_speed_level,
        coinsPerHour: userData.coins_per_hour,
        nextRateCost,
        nextSpeedCost,
        tokens: userData.vault_tokens
    };
}
