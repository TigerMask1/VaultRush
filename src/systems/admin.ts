import { pool } from '../database/db';

const SUPER_ADMIN_ID = '1296110901057032202';

export async function isSuperAdmin(userId: string): Promise<boolean> {
    const result = await pool.query(
        `SELECT is_super_admin FROM admins WHERE user_id = $1`,
        [userId]
    );
    
    return result.rows.length > 0 && result.rows[0].is_super_admin;
}

export async function isAdmin(userId: string): Promise<boolean> {
    const result = await pool.query(
        `SELECT * FROM admins WHERE user_id = $1`,
        [userId]
    );
    
    return result.rows.length > 0;
}

export async function isServerAdmin(userId: string, guildId: string): Promise<boolean> {
    const superAdmin = await isSuperAdmin(userId);
    if (superAdmin) return true;
    
    const admin = await isAdmin(userId);
    return admin;
}

export async function grantAdmin(granterId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    const isSuperAdminGranter = await isSuperAdmin(granterId);
    
    if (!isSuperAdminGranter) {
        return { success: false, message: 'Only super admins can grant admin permissions' };
    }
    
    const result = await pool.query(
        `INSERT INTO admins (user_id, is_super_admin, granted_by)
         VALUES ($1, false, $2)
         ON CONFLICT (user_id) DO NOTHING
         RETURNING *`,
        [targetUserId, granterId]
    );
    
    if (result.rows.length === 0) {
        return { success: false, message: 'User is already an admin' };
    }
    
    return { success: true, message: 'Admin permissions granted successfully' };
}

export async function revokeAdmin(revokerId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    const isSuperAdminRevoker = await isSuperAdmin(revokerId);
    
    if (!isSuperAdminRevoker) {
        return { success: false, message: 'Only super admins can revoke admin permissions' };
    }
    
    if (targetUserId === SUPER_ADMIN_ID) {
        return { success: false, message: 'Cannot revoke super admin permissions' };
    }
    
    const result = await pool.query(
        `DELETE FROM admins WHERE user_id = $1 AND is_super_admin = false
         RETURNING *`,
        [targetUserId]
    );
    
    if (result.rows.length === 0) {
        return { success: false, message: 'User is not an admin or is a super admin' };
    }
    
    return { success: true, message: 'Admin permissions revoked successfully' };
}

export async function listAdmins() {
    const result = await pool.query(
        `SELECT a.*, u.username FROM admins a
         LEFT JOIN users u ON a.user_id = u.discord_id
         ORDER BY a.is_super_admin DESC, a.granted_at ASC`
    );
    
    return result.rows;
}

export async function getServerSettings(guildId: string) {
    const result = await pool.query(
        `SELECT * FROM server_settings WHERE guild_id = $1`,
        [guildId]
    );
    
    return result.rows[0] || null;
}

export async function updateServerSettings(guildId: string, settings: { updates_channel_id?: string; war_enabled?: boolean }) {
    const result = await pool.query(
        `INSERT INTO server_settings (guild_id, updates_channel_id, war_enabled)
         VALUES ($1, $2, $3)
         ON CONFLICT (guild_id) 
         DO UPDATE SET 
            updates_channel_id = COALESCE($2, server_settings.updates_channel_id),
            war_enabled = COALESCE($3, server_settings.war_enabled)
         RETURNING *`,
        [guildId, settings.updates_channel_id || null, settings.war_enabled ?? null]
    );
    
    return result.rows[0];
}
