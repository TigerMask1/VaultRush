import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function initializeDatabase(): Promise<void> {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        await pool.query(schema);
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
}

export async function getOrCreateUser(discordId: string, username: string) {
    const result = await pool.query(
        `INSERT INTO users (discord_id, username)
         VALUES ($1, $2)
         ON CONFLICT (discord_id) 
         DO UPDATE SET username = $2
         RETURNING *`,
        [discordId, username]
    );
    return result.rows[0];
}

export async function calculatePendingCoins(userId: string): Promise<number> {
    const result = await pool.query(
        `SELECT last_collection, coins_per_hour, vault_level, vault_speed_level FROM users WHERE discord_id = $1`,
        [userId]
    );
    
    if (result.rows.length === 0) return 0;
    
    const { last_collection, coins_per_hour, vault_level, vault_speed_level } = result.rows[0];
    const now = new Date();
    const lastCollection = new Date(last_collection);
    const hoursPassed = (now.getTime() - lastCollection.getTime()) / (1000 * 60 * 60);
    
    const artifactBonuses = await pool.query(
        `SELECT SUM(bonus_value) as total_bonus 
         FROM artifacts 
         WHERE owner_id = $1 AND bonus_type = 'coin_rate'`,
        [userId]
    );
    
    const bonusMultiplier = 1 + (artifactBonuses.rows[0]?.total_bonus || 0);
    const speedBonus = vault_speed_level * 0.1;
    const effectiveRate = coins_per_hour * bonusMultiplier * (1 + speedBonus);
    
    return Math.floor(hoursPassed * effectiveRate);
}
