import { pool } from '../database/db';

export function getCurrentWeekNumber(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
}

export async function startVaultWar() {
    const weekNumber = getCurrentWeekNumber();
    
    const warEnabledAlliances = await pool.query(
        `SELECT * FROM server_alliances 
         WHERE war_enabled = true 
         ORDER BY vault_power DESC 
         LIMIT 10`
    );
    
    for (const alliance of warEnabledAlliances.rows) {
        await pool.query(
            `INSERT INTO vault_wars (week_number, guild_id, vault_power, status)
             VALUES ($1, $2, $3, 'active')`,
            [weekNumber, alliance.guild_id, alliance.vault_power]
        );
    }
    
    return warEnabledAlliances.rows;
}

export async function finalizeVaultWar() {
    const weekNumber = getCurrentWeekNumber() - 1;
    
    const rankings = await pool.query(
        `SELECT * FROM vault_wars 
         WHERE week_number = $1 AND status = 'active'
         ORDER BY vault_power DESC`,
        [weekNumber]
    );
    
    if (rankings.rows.length === 0) return { winners: [], losers: [] };
    
    const totalCoins = rankings.rows.reduce((sum: number, r: any) => {
        return sum + (r.vault_power * 0.1);
    }, 0);
    
    const winners = rankings.rows.slice(0, Math.ceil(rankings.rows.length / 2));
    const losers = rankings.rows.slice(Math.ceil(rankings.rows.length / 2));
    
    const coinsPerWinner = Math.floor(totalCoins / winners.length);
    
    for (let i = 0; i < winners.length; i++) {
        const winner = winners[i];
        await pool.query(
            `UPDATE vault_wars 
             SET rank = $1, coins_won = $2, status = 'completed'
             WHERE id = $3`,
            [i + 1, coinsPerWinner, winner.id]
        );
        
        await pool.query(
            `UPDATE server_alliances 
             SET vault_coins = vault_coins + $1
             WHERE guild_id = $2`,
            [coinsPerWinner, winner.guild_id]
        );
        
        if (i === 0) {
            await pool.query(
                `INSERT INTO artifacts (owner_id, name, rarity, bonus_type, bonus_value, description, acquired_from)
                 SELECT discord_id, 'Golden Reactor', 'Legendary', 'coin_rate', 1.0, 'Vault Wars Champion Artifact - +100% coin generation', 'vault_wars'
                 FROM users 
                 JOIN alliance_contributions ON users.discord_id = alliance_contributions.user_id
                 WHERE alliance_contributions.guild_id = $1
                 GROUP BY users.discord_id
                 ORDER BY SUM(alliance_contributions.amount) DESC
                 LIMIT 1`,
                [winner.guild_id]
            );
        }
    }
    
    for (let i = 0; i < losers.length; i++) {
        const loser = losers[i];
        const coinsLost = Math.floor(loser.vault_power * 0.1);
        
        await pool.query(
            `UPDATE vault_wars 
             SET rank = $1, coins_lost = $2, status = 'completed'
             WHERE id = $3`,
            [winners.length + i + 1, coinsLost, loser.id]
        );
        
        await pool.query(
            `UPDATE server_alliances 
             SET vault_coins = GREATEST(0, vault_coins - $1)
             WHERE guild_id = $2`,
            [coinsLost, loser.guild_id]
        );
    }
    
    return { winners, losers, coinsPerWinner };
}

export async function getWarRankings(weekNumber?: number) {
    const week = weekNumber || getCurrentWeekNumber();
    
    const result = await pool.query(
        `SELECT vw.*, sa.guild_name FROM vault_wars vw
         JOIN server_alliances sa ON vw.guild_id = sa.guild_id
         WHERE vw.week_number = $1
         ORDER BY vw.rank ASC NULLS LAST, vw.vault_power DESC`,
        [week]
    );
    
    return result.rows;
}

export async function enableWarForAlliance(guildId: string, enabled: boolean) {
    await pool.query(
        `UPDATE server_alliances SET war_enabled = $1 WHERE guild_id = $2`,
        [enabled, guildId]
    );
    
    await pool.query(
        `INSERT INTO server_settings (guild_id, war_enabled)
         VALUES ($1, $2)
         ON CONFLICT (guild_id) 
         DO UPDATE SET war_enabled = $2`,
        [guildId, enabled]
    );
}
