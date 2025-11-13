# VaultRush - Discord Economy Game

## Overview
VaultRush is a comprehensive Discord bot game featuring automatic vault coin generation, collectible artifacts with rarity tiers, live auctions, market trading, **stock market investments**, **hybrid command system**, and extensive mini-games. Built with Discord.js, TypeScript, and PostgreSQL for persistent cloud storage.

## Recent Changes
- **2025-11-13**: MAJOR UPDATE - Added `/start` command, stock market system, hybrid @bot command support, and 8 new mini-games
- **2025-11-13**: Added server alliances, maintenance system, vault skins, loans, vault wars, admin system, and activity feed
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
├── index.ts              # Main bot entry point with hybrid command support
├── commands/             # Slash command implementations
│   ├── start-command.ts  # Player registration and onboarding
│   ├── help-command.ts   # Command reference guide
│   ├── stock-commands.ts # Stock market trading commands
│   ├── new-minigames.ts  # 8 new mini-games
│   ├── vault-commands.ts # Core vault operations
│   ├── game-commands.ts  # Original mini-games
│   └── ...               # Other command files
├── database/             # Database connection and schema
├── systems/              # Core game systems
│   ├── stocks.ts         # Stock market logic
│   ├── new-minigames.ts  # Mini-game mechanics
│   ├── vault.ts          # Vault management
│   └── ...               # Other systems
└── utils/                # Helper functions
```

## Core Features

### 1. Vault System
- **Automatic Coin Generation**: Passive income even when offline
- **Upgrade System**: Improve coin rate and generation speed
- **Maintenance System**: Stay active to keep vaults producing
- **Vault Skins**: Customize your vault appearance (unlockable)

### 2. NEW: Stock Market 📈
- **List Your Vault**: Make your vault publicly tradable on the stock market
- **Buy Shares**: Invest in other players' vaults and earn dividends
- **Dynamic Pricing**: Prices fluctuate based on vault performance
- **Dividends**: Earn passive income from your stock holdings
- **Portfolio Tracking**: View all your investments and profits

Commands:
- `/list-stock` - List your vault on the stock market
- `/stocks` - View all available vault stocks
- `/buy-shares <symbol> <quantity>` - Buy shares
- `/sell-shares <symbol> <quantity>` - Sell shares
- `/portfolio` - View your stock portfolio
- `/stock-info <symbol>` - Detailed stock information

### 3. NEW: Hybrid Command System 🤖
Players can now use commands in two ways:
- **Slash Commands**: `/collect`, `/vault`, `/help`, etc.
- **@Mention Commands**: `@VaultRush collect`, `@VaultRush vault`, etc.

This provides flexibility for users who prefer different interaction styles.

### 4. NEW: Mini-Games Expansion 🎲
**Original Games:**
- `/coinflip` - Double or nothing coin flip
- `/raid` - Attack other players' vaults
- `/crate` - Open mystery crates

**NEW Games:**
- `/dice` - Roll dice and predict the outcome (10x payout for exact match!)
- `/blackjack` - Play blackjack against the dealer (2:1 payout)
- `/slots` - Spin the slot machine (50x jackpot!)
- `/daily` - Claim daily rewards with streak bonuses
- `/trivia` - Answer trivia questions for coins
- `/roulette` - Bet on red/black/even/odd
- `/lottery` - Buy tickets for a chance at 50,000 coin jackpot
- `/rps` - Play rock-paper-scissors

### 5. Artifacts & Trading
- **Artifact Collection**: Four rarity tiers with passive bonuses
- **Auction House**: Live bidding system
- **Token Market**: Dynamic token trading

### 6. Alliance Features 🏰
- **Server Alliances**: Shared vaults for Discord servers
- **Vault Wars**: Weekly competitive events
- **Alliance Leaderboard**: Global rankings
- **Contributions**: Donate to boost your server's power

### 7. Economy Systems
- **Vault Loans**: Lend coins to other players with interest
- **Events**: Golden Hour (2x coins), Black Vault Day (rare drops)
- **Leaderboard**: Track top players

### 8. Administration
- **Admin System**: Hierarchical permissions
- **Server Settings**: Configurable updates channels
- **Sub-Admins**: Delegate permissions

## NEW: Getting Started with VaultRush

### For New Players
1. Use `/start` to register and get 1,000 starter coins
2. Use `/collect` to gather coins from your vault
3. Use `/vault` to check your stats
4. Play mini-games to earn more coins
5. Use `/help` for a complete command list

### Quick Start Commands
- `/start` - Register and learn about the bot
- `/collect` - Collect your vault coins
- `/daily` - Claim your daily reward
- `/dice 100 7` - Roll dice and bet 100 coins on rolling a 7
- `/slots 50` - Spin slots with a 50 coin bet
- `/stocks` - Browse the stock market

## Economy Design
The economy is **intentionally inflationary** with multiple coin sources and sinks:

**Coin Sources:**
- Passive vault generation (100 coins/hour base)
- Daily rewards (500-1,500 coins with streaks)
- Mini-games (various payouts)
- Stock market dividends
- Successful raids

**Coin Sinks:**
- Vault upgrades (exponential costs)
- Stock market investments
- Mini-game losses
- Auction house
- Mystery crates
- Lottery tickets

**Balance Mechanisms:**
- Exponential upgrade costs (1.5x per level)
- Stock market risk/reward dynamics
- Mini-game house edge
- Social redistribution through auctions and raids

## Database Schema

### Core Tables
- **users**: Player accounts with vault stats and balances
- **artifacts**: Collectible items with rarity and bonuses
- **auctions**: Active and completed auctions
- **market_orders**: Buy/sell orders for vault tokens
- **transactions**: Economy activity log

### NEW: Stock Market Tables
- **vault_stocks**: Listed vault stocks with pricing
- **stock_holdings**: Player share ownership
- **stock_transactions**: Trading history
- **stock_dividends**: Dividend payment records

### Alliance & Features Tables
- **server_alliances**: Server vault data
- **vault_skins**: Available skins
- **loans**: Peer-to-peer lending
- **vault_wars**: Weekly competition data
- **admins**: Bot administrators

## Command Reference

### Essential Commands
- `/start` - Register and get started
- `/help` - View all commands
- `/collect` - Collect vault coins
- `/vault` - View vault stats
- `/daily` - Claim daily reward

### Mini-Games
- `/coinflip <bet> <heads/tails>` - Coin flip
- `/dice <bet> <prediction>` - Dice roll
- `/blackjack <bet>` - Blackjack
- `/slots <bet>` - Slot machine
- `/roulette <bet> <red/black/even/odd>` - Roulette
- `/rps <bet> <rock/paper/scissors>` - RPS
- `/lottery` - Buy lottery ticket
- `/trivia` - Trivia challenge
- `/raid <@user>` - Raid vault
- `/crate` - Mystery crate

### Stock Market
- `/list-stock` - List your vault
- `/stocks` - View market
- `/buy-shares <symbol> <qty>` - Buy
- `/sell-shares <symbol> <qty>` - Sell
- `/portfolio` - Your holdings
- `/stock-info <symbol>` - Stock details

### Vault Management
- `/upgrade <rate/speed>` - Upgrade vault
- `/vaultskin <view/myskins/equip>` - Manage skins

### Trading & Economy
- `/artifacts` - View collection
- `/auction-create` - Create auction
- `/auctions` - View auctions
- `/market` - Token market
- `/loan` - Create loan
- `/myloans` - View loans

### Alliance
- `/alliance` - View server alliance
- `/contribute <amount>` - Donate coins
- `/alliance-leaderboard` - Rankings
- `/war-rankings` - Vault wars

### Information
- `/events` - Active events
- `/leaderboard` - Top players

## User Preferences
- Hybrid command system preferred (both / and @mention)
- Extensive mini-games for earning coins
- Stock market for investment and passive income
- Comprehensive onboarding with `/start` command

## Dependencies
- discord.js: Discord bot framework
- pg: PostgreSQL client
- node-cron: Event scheduling and automation
- typescript: Type safety
- dotenv: Environment configuration

## Automated Systems
- **Stock Prices**: Updated every 2 hours based on vault performance
- **Dividends**: Paid daily to all stockholders
- **Events**: Random events scheduled throughout the day
- **Vault Wars**: Weekly Monday start, Friday end
- **Auctions**: Auto-finalized when expired
- **Loans**: Auto-deducted when overdue
