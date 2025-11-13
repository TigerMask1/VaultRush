import { pool } from '../database/db';

export async function createHighlight(guildId: string | null, message: string, highlightType: string) {
    await pool.query(
        `INSERT INTO activity_highlights (guild_id, message, highlight_type)
         VALUES ($1, $2, $3)`,
        [guildId, message, highlightType]
    );
}

export async function getRecentHighlights(guildId: string, limit: number = 5) {
    const result = await pool.query(
        `SELECT * FROM activity_highlights 
         WHERE guild_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [guildId, limit]
    );
    
    return result.rows;
}

export async function generateHourlyHighlights() {
    const highlights = [];
    
    const topAlliance = await pool.query(
        `SELECT guild_name, vault_coins FROM server_alliances 
         WHERE vault_coins >= 1000000
         ORDER BY vault_coins DESC 
         LIMIT 1`
    );
    
    if (topAlliance.rows.length > 0) {
        const alliance = topAlliance.rows[0];
        if (Math.random() < 0.3) {
            highlights.push({
                message: `🔥 Alliance ${alliance.guild_name} just hit ${(alliance.vault_coins / 1000000).toFixed(1)}M coins!`,
                type: 'alliance_milestone'
            });
        }
    }
    
    const bigSpender = await pool.query(
        `SELECT u.username, SUM(t.amount) as total_spent
         FROM transactions t
         JOIN users u ON t.user_id = u.discord_id
         WHERE t.transaction_type = 'upgrade' 
         AND t.created_at > NOW() - INTERVAL '1 hour'
         GROUP BY u.username
         ORDER BY total_spent DESC
         LIMIT 1`
    );
    
    if (bigSpender.rows.length > 0 && bigSpender.rows[0].total_spent > 10000) {
        highlights.push({
            message: `💰 ${bigSpender.rows[0].username} just spent ${bigSpender.rows[0].total_spent.toLocaleString()} coins on upgrades!`,
            type: 'big_spender'
        });
    }
    
    const bigContributor = await pool.query(
        `SELECT u.username, sa.guild_name, SUM(ac.amount) as total_contributed
         FROM alliance_contributions ac
         JOIN users u ON ac.user_id = u.discord_id
         JOIN server_alliances sa ON ac.guild_id = sa.guild_id
         WHERE ac.contributed_at > NOW() - INTERVAL '1 hour'
         GROUP BY u.username, sa.guild_name
         ORDER BY total_contributed DESC
         LIMIT 1`
    );
    
    if (bigContributor.rows.length > 0 && bigContributor.rows[0].total_contributed > 50000) {
        highlights.push({
            message: `⭐ ${bigContributor.rows[0].username} contributed ${bigContributor.rows[0].total_contributed.toLocaleString()} coins to ${bigContributor.rows[0].guild_name}!`,
            type: 'big_contribution'
        });
    }
    
    return highlights;
}

export async function checkAllianceMilestones(guildId: string, vaultCoins: number) {
    const milestones = [
        { threshold: 100000, message: '💯 Alliance reached 100K coins!' },
        { threshold: 500000, message: '🌟 Alliance reached 500K coins!' },
        { threshold: 1000000, message: '🔥 Alliance just hit 1M coins!' },
        { threshold: 5000000, message: '👑 Alliance reached 5M coins - legendary status!' }
    ];
    
    for (const milestone of milestones) {
        if (vaultCoins >= milestone.threshold && vaultCoins - 10000 < milestone.threshold) {
            await createHighlight(guildId, milestone.message, 'alliance_milestone');
            return milestone.message;
        }
    }
    
    return null;
}
