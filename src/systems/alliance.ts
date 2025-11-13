import { pool } from '../database/db';

export async function getOrCreateAlliance(guildId: string, guildName: string) {
    const result = await pool.query(
        `INSERT INTO server_alliances (guild_id, guild_name)
         VALUES ($1, $2)
         ON CONFLICT (guild_id) 
         DO UPDATE SET guild_name = $2, last_activity = CURRENT_TIMESTAMP
         RETURNING *`,
        [guildId, guildName]
    );
    return result.rows[0];
}

export async function contributeToAlliance(guildId: string, userId: string, amount: number) {
    const user = await pool.query(`SELECT coins FROM users WHERE discord_id = $1`, [userId]);
    
    if (user.rows.length === 0 || user.rows[0].coins < amount) {
        return { success: false, message: 'Insufficient coins' };
    }
    
    await pool.query(`UPDATE users SET coins = coins - $1 WHERE discord_id = $2`, [amount, userId]);
    
    await pool.query(
        `UPDATE server_alliances 
         SET vault_coins = vault_coins + $1, 
             vault_power = vault_power + $1,
             total_contributions = total_contributions + $1,
             last_activity = CURRENT_TIMESTAMP
         WHERE guild_id = $2`,
        [amount, guildId]
    );
    
    await pool.query(
        `INSERT INTO alliance_contributions (guild_id, user_id, amount)
         VALUES ($1, $2, $3)`,
        [guildId, userId, amount]
    );
    
    return { success: true, amount };
}

export async function getAllianceInfo(guildId: string) {
    const alliance = await pool.query(`SELECT * FROM server_alliances WHERE guild_id = $1`, [guildId]);
    
    if (alliance.rows.length === 0) return null;
    
    const topContributors = await pool.query(
        `SELECT u.username, SUM(ac.amount) as total_contributed
         FROM alliance_contributions ac
         JOIN users u ON ac.user_id = u.discord_id
         WHERE ac.guild_id = $1
         GROUP BY u.username
         ORDER BY total_contributed DESC
         LIMIT 5`,
        [guildId]
    );
    
    return {
        ...alliance.rows[0],
        topContributors: topContributors.rows
    };
}

export async function getGlobalAllianceLeaderboard(limit: number = 10) {
    const result = await pool.query(
        `SELECT guild_name, vault_power, vault_coins, total_contributions
         FROM server_alliances
         ORDER BY vault_power DESC
         LIMIT $1`,
        [limit]
    );
    
    return result.rows;
}

export async function upgradeAllianceVault(guildId: string) {
    const alliance = await pool.query(`SELECT * FROM server_alliances WHERE guild_id = $1`, [guildId]);
    
    if (alliance.rows.length === 0) {
        return { success: false, message: 'Alliance not found' };
    }
    
    const currentLevel = alliance.rows[0].vault_level;
    const cost = Math.floor(10000 * Math.pow(1.5, currentLevel - 1));
    
    if (alliance.rows[0].vault_coins < cost) {
        return { success: false, message: `Need ${cost.toLocaleString()} coins in alliance vault`, cost };
    }
    
    await pool.query(
        `UPDATE server_alliances 
         SET vault_coins = vault_coins - $1,
             vault_level = vault_level + 1,
             vault_power = vault_power + 1000
         WHERE guild_id = $2`,
        [cost, guildId]
    );
    
    return { success: true, newLevel: currentLevel + 1, cost };
}
