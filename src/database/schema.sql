CREATE TABLE IF NOT EXISTS users (
    discord_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    coins BIGINT DEFAULT 0,
    vault_tokens INTEGER DEFAULT 0,
    vault_level INTEGER DEFAULT 1,
    vault_speed_level INTEGER DEFAULT 1,
    coins_per_hour FLOAT DEFAULT 100.0,
    last_collection TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

CREATE INDEX IF NOT EXISTS idx_users_coins ON users(coins DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_owner ON artifacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status, ends_at);
CREATE INDEX IF NOT EXISTS idx_market_orders_status ON market_orders(status, order_type);
