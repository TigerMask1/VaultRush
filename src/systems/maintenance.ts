import { pool } from '../database/db';

const INACTIVITY_THRESHOLD_HOURS = 6;

export async function checkUserActivity(userId: string): Promise<boolean> {
    const result = await pool.query(
        `SELECT last_activity FROM users WHERE discord_id = $1`,
        [userId]
    );
    
    if (result.rows.length === 0) return false;
    
    const lastActivity = new Date(result.rows[0].last_activity);
    const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceActivity < INACTIVITY_THRESHOLD_HOURS;
}

export async function updateUserActivity(userId: string) {
    await pool.query(
        `UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE discord_id = $1`,
        [userId]
    );
}

export async function getInactiveUsers(): Promise<any[]> {
    const threshold = new Date(Date.now() - INACTIVITY_THRESHOLD_HOURS * 60 * 60 * 1000);
    
    const result = await pool.query(
        `SELECT discord_id, username, last_activity FROM users 
         WHERE last_activity < $1`,
        [threshold]
    );
    
    return result.rows;
}

export async function checkAllianceActivity(guildId: string): Promise<boolean> {
    const result = await pool.query(
        `SELECT last_activity FROM server_alliances WHERE guild_id = $1`,
        [guildId]
    );
    
    if (result.rows.length === 0) return false;
    
    const lastActivity = new Date(result.rows[0].last_activity);
    const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceActivity < INACTIVITY_THRESHOLD_HOURS;
}

export function isVaultProducing(lastActivity: Date): boolean {
    const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
    return hoursSinceActivity < INACTIVITY_THRESHOLD_HOURS;
}
