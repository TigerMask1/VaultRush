import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function initializeDatabase(): Promise<void> {
    try {
        const schema = `
CREATE TABLE IF NOT EXISTS users (
    discord_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    coins BIGINT DEFAULT 0,
    vault_tokens INTEGER DEFAULT 0,
    vault_level INTEGER DEFAULT 1,
    vault_speed_level INTEGER DEFAULT 1,
    coins_per_hour FLOAT DEFAULT 100.0,
    last_collection TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_earned BIGINT DEFAULT 0,
    total_spent BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS artifacts (
    id SERIAL PRIMARY KEY,
    owner_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    bonus_type VARCHAR(50) NOT NULL,
    bonus_value FLOAT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acquired_from VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS auctions (
    id SERIAL PRIMARY KEY,
    artifact_id INTEGER REFERENCES artifacts(id) ON DELETE CASCADE,
    seller_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    current_bid BIGINT DEFAULT 0,
    current_bidder_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE SET NULL,
    starting_bid BIGINT NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_orders (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    order_type VARCHAR(10) NOT NULL,
    tokens INTEGER NOT NULL,
    price_per_token BIGINT NOT NULL,
    filled INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP,
    multiplier FLOAT DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount BIGINT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_stats (
    id SERIAL PRIMARY KEY,
    total_coins_circulating BIGINT DEFAULT 0,
    total_artifacts INTEGER DEFAULT 0,
    token_market_price BIGINT DEFAULT 100,
    last_event_time TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO game_stats (total_coins_circulating, total_artifacts, token_market_price)
VALUES (0, 0, 100)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS server_alliances (
    guild_id VARCHAR(20) PRIMARY KEY,
    guild_name VARCHAR(255) NOT NULL,
    vault_coins BIGINT DEFAULT 0,
    vault_level INTEGER DEFAULT 1,
    vault_power BIGINT DEFAULT 0,
    total_contributions BIGINT DEFAULT 0,
    war_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alliance_contributions (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) REFERENCES server_alliances(guild_id) ON DELETE CASCADE,
    user_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    contributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vault_skins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    rarity VARCHAR(20) DEFAULT 'Common',
    unlock_requirement TEXT
);

CREATE TABLE IF NOT EXISTS user_skins (
    user_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    skin_id INTEGER REFERENCES vault_skins(id) ON DELETE CASCADE,
    equipped BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, skin_id)
);

CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    lender_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    borrower_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    interest_rate FLOAT DEFAULT 0.1,
    total_owed BIGINT NOT NULL,
    amount_paid BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    user_id VARCHAR(20) PRIMARY KEY,
    is_super_admin BOOLEAN DEFAULT false,
    granted_by VARCHAR(20),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS server_settings (
    guild_id VARCHAR(20) PRIMARY KEY,
    updates_channel_id VARCHAR(20),
    war_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vault_wars (
    id SERIAL PRIMARY KEY,
    week_number INTEGER NOT NULL,
    guild_id VARCHAR(20) REFERENCES server_alliances(guild_id) ON DELETE CASCADE,
    vault_power BIGINT DEFAULT 0,
    rank INTEGER,
    coins_won BIGINT DEFAULT 0,
    coins_lost BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_highlights (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20),
    message TEXT NOT NULL,
    highlight_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vault_stocks (
    id SERIAL PRIMARY KEY,
    vault_owner_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    total_shares BIGINT DEFAULT 10000,
    shares_available BIGINT DEFAULT 10000,
    current_price BIGINT DEFAULT 100,
    price_change_24h FLOAT DEFAULT 0.0,
    market_cap BIGINT DEFAULT 0,
    dividend_rate FLOAT DEFAULT 0.05,
    last_dividend_payout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    performance_score FLOAT DEFAULT 1.0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_holdings (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES vault_stocks(id) ON DELETE CASCADE,
    holder_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    shares_owned BIGINT DEFAULT 0,
    average_buy_price BIGINT DEFAULT 0,
    total_invested BIGINT DEFAULT 0,
    total_dividends_earned BIGINT DEFAULT 0,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, holder_id)
);

CREATE TABLE IF NOT EXISTS stock_transactions (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES vault_stocks(id) ON DELETE CASCADE,
    user_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    transaction_type VARCHAR(10) NOT NULL,
    shares INTEGER NOT NULL,
    price_per_share BIGINT NOT NULL,
    total_amount BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_dividends (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES vault_stocks(id) ON DELETE CASCADE,
    holder_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    shares_held BIGINT NOT NULL,
    payout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admins (user_id, is_super_admin, granted_by)
VALUES ('1296110901057032202', true, 'system')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO vault_skins (name, description, image_url, rarity, unlock_requirement)
VALUES 
    ('Classic Vault', 'The original vault design', 'placeholder_classic.png', 'Common', 'default'),
    ('Golden Vault', 'Shiny and prestigious', 'placeholder_golden.png', 'Rare', 'Reach 100k coins'),
    ('Diamond Vault', 'Sparkles with wealth', 'placeholder_diamond.png', 'Epic', 'Reach 1M coins'),
    ('Cosmic Vault', 'Out of this world', 'placeholder_cosmic.png', 'Legendary', 'Win Vault Wars')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_users_coins ON users(coins DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_owner ON artifacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status, ends_at);
CREATE INDEX IF NOT EXISTS idx_market_orders_status ON market_orders(status, order_type);
CREATE INDEX IF NOT EXISTS idx_alliances_power ON server_alliances(vault_power DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_guild ON alliance_contributions(guild_id);
CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_id, status);
CREATE INDEX IF NOT EXISTS idx_wars_week ON vault_wars(week_number, rank);
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON vault_stocks(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_stocks_public ON vault_stocks(is_public, current_price DESC);
CREATE INDEX IF NOT EXISTS idx_holdings_holder ON stock_holdings(holder_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_user ON stock_transactions(user_id, created_at DESC);
        `;
        
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
        `SELECT last_collection, last_activity, coins_per_hour, vault_level, vault_speed_level FROM users WHERE discord_id = $1`,
        [userId]
    );
    
    if (result.rows.length === 0) return 0;
    
    const { last_collection, last_activity, coins_per_hour, vault_level, vault_speed_level } = result.rows[0];
    const now = new Date();
    const lastCollection = new Date(last_collection);
    const lastActivityTime = new Date(last_activity);
    
    const INACTIVITY_THRESHOLD_HOURS = 6;
    const productionStopTime = new Date(lastActivityTime.getTime() + INACTIVITY_THRESHOLD_HOURS * 60 * 60 * 1000);
    
    const effectiveEndTime = now < productionStopTime ? now : productionStopTime;
    
    const hoursPassed = Math.max(0, (effectiveEndTime.getTime() - lastCollection.getTime()) / (1000 * 60 * 60));
    
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
