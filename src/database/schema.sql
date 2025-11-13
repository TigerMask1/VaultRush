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
    total_contributions BIGINT DEFAULT 0,
    member_count INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alliance_contributions (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) REFERENCES server_alliances(guild_id) ON DELETE CASCADE,
    user_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    contributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vault_stocks (
    id SERIAL PRIMARY KEY,
    vault_owner_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    stock_symbol VARCHAR(10) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    current_price BIGINT DEFAULT 100,
    total_shares INTEGER DEFAULT 1000,
    available_shares INTEGER DEFAULT 1000,
    market_cap BIGINT DEFAULT 0,
    performance_score FLOAT DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_holdings (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES vault_stocks(id) ON DELETE CASCADE,
    holder_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    shares INTEGER NOT NULL,
    purchase_price BIGINT NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_id, holder_id)
);

CREATE TABLE IF NOT EXISTS stock_transactions (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES vault_stocks(id) ON DELETE CASCADE,
    buyer_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    seller_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE SET NULL,
    shares INTEGER NOT NULL,
    price_per_share BIGINT NOT NULL,
    total_amount BIGINT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_dividends (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES vault_stocks(id) ON DELETE CASCADE,
    holder_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    lender_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    borrower_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    interest_rate FLOAT DEFAULT 0.1,
    total_owed BIGINT NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    due_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vault_skins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rarity VARCHAR(20) NOT NULL,
    unlock_condition TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_skins (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    skin_id INTEGER REFERENCES vault_skins(id) ON DELETE CASCADE,
    is_equipped BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skin_id)
);

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    discord_id VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    permission_level INTEGER DEFAULT 1,
    granted_by VARCHAR(20),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS server_settings (
    guild_id VARCHAR(20) PRIMARY KEY,
    updates_channel_id VARCHAR(20),
    war_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vault_wars (
    id SERIAL PRIMARY KEY,
    week_number INTEGER UNIQUE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    winner_guild_id VARCHAR(20),
    winner_prize BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS activity_highlights (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES users(discord_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    value BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_coins ON users(coins DESC);
CREATE INDEX IF NOT EXISTS idx_users_activity ON users(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_owner ON artifacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status, ends_at);
CREATE INDEX IF NOT EXISTS idx_market_orders_status ON market_orders(status, order_type);
CREATE INDEX IF NOT EXISTS idx_stock_holdings ON stock_holdings(holder_id, stock_id);
CREATE INDEX IF NOT EXISTS idx_stocks_public ON vault_stocks(is_public, stock_symbol);
CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_id, is_paid);
CREATE INDEX IF NOT EXISTS idx_alliances_coins ON server_alliances(vault_coins DESC);
