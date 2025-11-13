import { pool } from '../database/db';

export async function getAvailableSkins() {
    const result = await pool.query(`SELECT * FROM vault_skins ORDER BY id ASC`);
    return result.rows;
}

export async function getUserSkins(userId: string) {
    const result = await pool.query(
        `SELECT vs.*, us.equipped, us.unlocked_at
         FROM user_skins us
         JOIN vault_skins vs ON us.skin_id = vs.id
         WHERE us.user_id = $1
         ORDER BY vs.id ASC`,
        [userId]
    );
    
    return result.rows;
}

export async function unlockSkin(userId: string, skinId: number) {
    const result = await pool.query(
        `INSERT INTO user_skins (user_id, skin_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, skin_id) DO NOTHING
         RETURNING *`,
        [userId, skinId]
    );
    
    return result.rows.length > 0;
}

export async function equipSkin(userId: string, skinId: number) {
    const owned = await pool.query(
        `SELECT * FROM user_skins WHERE user_id = $1 AND skin_id = $2`,
        [userId, skinId]
    );
    
    if (owned.rows.length === 0) {
        return { success: false, message: 'You do not own this skin' };
    }
    
    await pool.query(
        `UPDATE user_skins SET equipped = false WHERE user_id = $1`,
        [userId]
    );
    
    await pool.query(
        `UPDATE user_skins SET equipped = true WHERE user_id = $1 AND skin_id = $2`,
        [userId, skinId]
    );
    
    return { success: true };
}

export async function getEquippedSkin(userId: string) {
    const result = await pool.query(
        `SELECT vs.* FROM user_skins us
         JOIN vault_skins vs ON us.skin_id = vs.id
         WHERE us.user_id = $1 AND us.equipped = true
         LIMIT 1`,
        [userId]
    );
    
    return result.rows[0] || null;
}

export async function checkAndUnlockSkins(userId: string, userCoins: number) {
    const unlockedSkins = [];
    
    if (userCoins >= 100000) {
        const unlocked = await unlockSkin(userId, 2);
        if (unlocked) unlockedSkins.push('Golden Vault');
    }
    
    if (userCoins >= 1000000) {
        const unlocked = await unlockSkin(userId, 3);
        if (unlocked) unlockedSkins.push('Diamond Vault');
    }
    
    return unlockedSkins;
}
