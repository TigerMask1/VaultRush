# 🎮 VaultRush - Discord Economy Game

VaultRush is an addictive Discord bot game featuring automatic vault coin generation, collectible artifacts, live auctions, market trading, and timed events with persistent cloud storage.

## 🚀 Quick Start

The bot is now running and all slash commands are registered! Invite the bot to your Discord server and start playing.

## 🎯 Core Features

### 💰 Vault System
- **Automatic Coin Generation**: Your vault generates coins passively, even when offline
- **Collection Rewards**: Use `/collect` to gather your earned coins
- **Upgrades**: Improve your vault's coin rate and generation speed
  - `/upgrade type:rate` - Increases coins per hour (+50/level)
  - `/upgrade type:speed` - Makes generation 10% faster per level

### ✨ Artifacts
- **Rarity Tiers**: Common ⚪, Rare 🔵, Epic 🟣, Legendary 🟡
- **Passive Bonuses**: Artifacts boost coin generation, speed, or luck
- **Collection**: View your artifacts with `/artifacts`
- **Drop System**: Random chance to find artifacts when collecting coins during events

### 🔨 Auction House
- **Create Auctions**: `/auction-create artifact_id:ID starting_bid:AMOUNT duration:MINUTES`
- **Place Bids**: `/auction-bid auction_id:ID bid_amount:AMOUNT`
- **View Active**: `/auctions` shows all current auctions
- **Live Bidding**: Outbid other players in real-time

### 📊 Vault Market
- **Token Trading**: Buy and sell Vault Tokens with dynamic pricing
- **Buy Orders**: `/market-buy tokens:AMOUNT price_per_token:PRICE`
- **Sell Orders**: `/market-sell tokens:AMOUNT price_per_token:PRICE`
- **Market Stats**: `/market` shows current prices and active orders
- **Auto-Matching**: Orders automatically match when prices align

### 🎉 Events
- **Golden Hour**: 2x coin generation for 10 minutes (random every 3 hours)
- **Black Vault Day**: Increased artifact drop rates for 1 hour
- **Active Events**: `/events` shows what's happening now

### 🎲 Mini-Games
- **Coin Flip**: `/coinflip bet:AMOUNT choice:heads/tails` - Double or nothing!
- **Vault Raids**: `/raid target:@user` - Attack other players for 15% of their coins
- **Mystery Crates**: `/crate` - Spend 1000 coins for random rewards (coins, tokens, or artifacts)

### 🏆 Leaderboard
- `/leaderboard` - See the top 10 richest players
- `/vault` - View your personal vault stats and pending coins

## 📋 Complete Command List

| Command | Description |
|---------|-------------|
| `/collect` | Collect coins from your vault |
| `/vault` | View your vault information |
| `/upgrade type:rate/speed` | Upgrade your vault |
| `/artifacts` | View your artifact collection |
| `/auction-create` | Create an auction for your artifact |
| `/auction-bid` | Place a bid on an auction |
| `/auctions` | View active auctions |
| `/market-buy` | Create a buy order for tokens |
| `/market-sell` | Create a sell order for tokens |
| `/market` | View market statistics |
| `/coinflip` | Flip a coin and bet on the outcome |
| `/raid` | Raid another player's vault |
| `/crate` | Open a mystery crate |
| `/events` | View active events |
| `/leaderboard` | View top players |

## 🎮 Gameplay Tips

1. **Collect Regularly**: Don't let your vault overflow - collect coins frequently!
2. **Upgrade Smart**: Balance between coin rate and speed upgrades
3. **Artifact Hunting**: Collect during events for better artifact drop chances
4. **Market Timing**: Buy tokens low, sell high for maximum profit
5. **Auction Strategy**: Bid on rare artifacts to boost your passive income
6. **Risk vs Reward**: Use mini-games strategically - don't bet coins you can't afford to lose
7. **Raid Wisely**: More artifacts = higher raid success chance

## 💾 Cloud Storage

All data is stored in PostgreSQL cloud database:
- Player vaults and balances persist forever
- Artifacts and collections are saved
- Transaction history is tracked
- Market orders and auctions are persistent
- No data loss between sessions

## 🔧 Technical Stack

- **Bot Framework**: Discord.js v14
- **Language**: TypeScript/Node.js 20
- **Database**: PostgreSQL (Neon-hosted)
- **Scheduler**: node-cron for events
- **Environment**: Replit Cloud

## 🎯 Economy Design

VaultRush features a **closed-loop economy**:
- Coins enter through vault generation
- Coins exit through upgrades, auctions, raids, and games
- No infinite coin exploits
- All transactions are logged
- Market prices adjust based on player activity

## 📈 Future Features

- Player-to-player direct trading
- Vault customization themes
- Guild team vaults and competitions
- Achievement system with rewards
- Anti-cheat measures and rate limiting

---

**Enjoy VaultRush! Start collecting, upgrading, and dominating the leaderboard!** 🚀
