# VaultRush - Discord Economy Game

## Overview
VaultRush is a Discord bot game featuring automatic vault coin generation, collectible artifacts with rarity tiers, live auctions, market trading, and timed events. Built with Discord.js, TypeScript, and PostgreSQL for persistent cloud storage.

## Recent Changes
- **2025-11-13**: Major expansion - Added server alliances, maintenance system, vault skins, loans, vault wars, admin system, and activity feed
- **2025-11-13**: Initial project setup with Node.js, TypeScript, and PostgreSQL integration

## Project Architecture
- **Language**: TypeScript/Node.js 20
- **Framework**: Discord.js v14
- **Database**: PostgreSQL (cloud-hosted via Replit)
- **Task Scheduler**: node-cron for events and passive generation
- **Integration**: Discord connector for bot authentication

### Directory Structure
```
src/
├── index.ts              # Main bot entry point
├── commands/             # Slash command implementations
├── database/             # Database connection and queries
├── systems/              # Core game systems (vault, artifacts, auction, market)
├── events/               # Event handlers and schedulers
└── utils/                # Helper functions
```

## Core Features
1. **Vault Machine**: Automatic offline coin generation with collection rewards (inflationary by design)
2. **Upgrade System**: Escalating costs for vault speed and coin rate improvements
3. **Artifacts**: Collectibles with rarity tiers (Common, Rare, Epic, Legendary) and passive bonuses
4. **Auction House**: Live bidding system for artifacts
5. **Vault Market**: Token trading with dynamic pricing
6. **Events**: Timed events like Golden Hour (2x coins) and Black Vault Day (rare drops)
7. **Mini-Games**: Coin flips and vault raids for high-risk rewards
8. **Leaderboard**: Rankings and vault displays

## Economy Design
The economy is **intentionally inflationary** to match user requirements for "automatic coin generation" as a core mechanic:
- **Coin Sources**: Passive vault generation (100 coins/hour base), winning mini-games, successful raids
- **Coin Sinks**: Vault upgrades (escalating costs), auction house, mystery crates, failed raids, coin flip losses
- **Balance Mechanism**: Exponential upgrade costs (1.5x multiplier per level) create natural progression caps
- **Social Features**: Auctions and raids redistribute coins between players, creating player-driven economy dynamics

This matches the user's vision of "reward rush" and "always have a reason to come back and grow."

## Database Schema
- **users**: Player accounts with vault stats and balances
- **artifacts**: Collectible items with rarity and bonuses
- **auctions**: Active and completed auctions
- **market_orders**: Buy/sell orders for vault tokens
- **events**: Scheduled and active events
- **transactions**: Economy activity log

## User Preferences
- None specified yet

## Dependencies
- discord.js: Discord bot framework
- pg: PostgreSQL client
- node-cron: Event scheduling
- typescript: Type safety
