import { pool } from '../database/db';
import { generateRandomArtifact } from './artifacts';
import cron from 'node-cron';

export async function startGoldenHour(): Promise<any> {
    const endsAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const result = await pool.query(
        `INSERT INTO events (event_type, description, ends_at, multiplier)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        ['golden_hour', 'Double coin generation for 10 minutes!', endsAt, 2.0]
    );
    
    return result.rows[0];
}

export async function startBlackVaultDay(): Promise<any> {
    const endsAt = new Date(Date.now() + 60 * 60 * 1000);
    
    const result = await pool.query(
        `INSERT INTO events (event_type, description, ends_at, multiplier)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        ['black_vault_day', 'Rare artifacts dropping for 1 hour!', endsAt, 1.0]
    );
    
    return result.rows[0];
}

export async function getActiveEvents() {
    const result = await pool.query(
        `SELECT * FROM events 
         WHERE is_active = true AND ends_at > CURRENT_TIMESTAMP
         ORDER BY created_at DESC`
    );
    
    return result.rows;
}

export async function endExpiredEvents() {
    await pool.query(
        `UPDATE events 
         SET is_active = false 
         WHERE is_active = true AND ends_at <= CURRENT_TIMESTAMP`
    );
}

export async function getActiveMultiplier(): Promise<number> {
    const activeEvents = await getActiveEvents();
    let totalMultiplier = 1.0;
    
    for (const event of activeEvents) {
        if (event.event_type === 'golden_hour') {
            totalMultiplier *= event.multiplier;
        }
    }
    
    return totalMultiplier;
}

export async function awardRandomArtifact(userId: string): Promise<any> {
    const activeEvents = await getActiveEvents();
    const isBlackVaultDay = activeEvents.some(e => e.event_type === 'black_vault_day');
    
    let chance = 0.10;
    if (isBlackVaultDay) chance = 0.30;
    
    if (Math.random() < chance) {
        return await generateRandomArtifact(userId, 'event_drop');
    }
    
    return null;
}

export function scheduleRandomEvents(announceCallback: (message: string) => void) {
    cron.schedule('0 */3 * * *', async () => {
        const eventRoll = Math.random();
        
        if (eventRoll < 0.4) {
            await startGoldenHour();
            announceCallback('🌟 **GOLDEN HOUR STARTED!** 🌟\nAll vaults generate 2x coins for the next 10 minutes! Collect now!');
        } else if (eventRoll < 0.6) {
            await startBlackVaultDay();
            announceCallback('🖤 **BLACK VAULT DAY!** 🖤\nRare artifacts are dropping! Use /collect to try your luck for the next hour!');
        }
    });
    
    cron.schedule('*/5 * * * *', async () => {
        await endExpiredEvents();
    });
}
