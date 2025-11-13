# VaultRush - Discord Economy Game

## Overview
VaultRush is a Discord bot game featuring automatic vault coin generation, collectible artifacts with rarity tiers, live auctions, market trading, and timed events. Built with Discord.js, TypeScript, and PostgreSQL for persistent cloud storage.

## Recent Changes
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
1. **Vault Machine**: Automatic offline coin generation with collection rewards
2. **Upgrade System**: Escalating costs for vault speed and coin rate improvements
3. **Artifacts**: Collectibles with rarity tiers (Common, Rare, Epic, Legendary) and passive bonuses
4. **Auction House**: Live bidding system for artifacts
5. **Vault Market**: Token trading with dynamic pricing
6. **Events**: Timed events like Golden Hour (2x coins) and Black Vault Day (rare drops)
7. **Mini-Games**: Coin flips and vault raids for high-risk rewards
8. **Leaderboard**: Rankings and vault displays

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
