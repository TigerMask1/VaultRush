# 🎮 VaultRush - New Features Guide

## 🆕 Recently Added Features

### 🏰 Server Alliances
Your Discord server now has its own Alliance Vault! Members can contribute coins to build server power and compete globally.

**Commands:**
- `/alliance` - View your server's alliance vault stats
- `/contribute amount:COINS` - Donate coins to your server vault (permanent, cannot be withdrawn)
- `/alliance-leaderboard` - See top 10 alliances globally
- `/alliance-upgrade` - Upgrade alliance vault (requires Manage Server permission)

**How it Works:**
- Each server has a shared vault
- Contributions add to total vault power
- Higher power = better leaderboard position
- Alliance coins can be used for upgrades and wars

### ⚙️ Maintenance System
Vaults now require activity to keep producing coins!

**How it Works:**
- Vaults generate coins for up to **6 hours** after your last activity
- After 6 hours of inactivity, production stops
- Use any command to restart production immediately
- Inactivity alerts posted to server's updates channel (if configured)

**Tip:** Collect regularly to maximize earnings!

### 💎 Vault Skins
Customize your vault appearance with unlockable skins!

**Commands:**
- `/vaultskin view` - See all available skins
- `/vaultskin myskins` - View your unlocked skins
- `/vaultskin equip skin_id:ID` - Equip a skin

**Available Skins:**
- **Classic Vault** (Common) - Default skin
- **Golden Vault** (Rare) - Unlock at 100K coins
- **Diamond Vault** (Epic) - Unlock at 1M coins  
- **Cosmic Vault** (Legendary) - Win Vault Wars to unlock

### 💰 Vault Loans
Lend coins to other players with interest!

**Commands:**
- `/loan borrower:@user amount:COINS interest_rate:0.1 duration_days:7` - Create a loan
- `/payloan loan_id:ID amount:COINS` - Repay a loan
- `/myloans` - View all your loans (borrowed and lent)
- `/cancel-loan loan_id:ID` - Cancel unpaid loan (if no payments made)

**How it Works:**
- Default 10% interest (adjustable)
- Borrowers receive coins immediately
- Interest calculated automatically
- Overdue loans auto-deduct from borrower's next collection
- Track all loans with unique IDs

### 🏆 Server Vault Rank
Donate to boost your server's power and earn rewards!

**How it Works:**
- Donate coins using `/contribute`
- Top contributing members tracked
- Weekly top servers earn **Golden Reactor** artifact
- Golden Reactor gives +100% coin generation to top contributor

### ⚔️ Vault Wars
Weekly competitive event for alliance dominance!

**Commands:**
- `/war-rankings week:NUMBER` - View current or past week rankings
- `/setup enable_wars:true` - Enable wars for your server (Manage Server required)

**How it Works:**
- **Starts:** Every Monday at midnight UTC
- **Ends:** Every Friday at midnight UTC
- Top 10 servers with wars enabled compete
- Winners split coins from losers' vaults
- #1 alliance's top contributor gets **Golden Reactor** artifact
- Rankings posted to server updates channel

### 👑 Admin System
Hierarchical permissions for bot management.

**Commands:**
- `/grant-admin user:@user` - Grant admin (super admin only)
- `/revoke-admin user:@user` - Revoke admin (super admin only)
- `/list-admins` - View all admins

**Admin Levels:**
- **Super Admin** - Full control (User ID: 1296110901057032202)
- **Regular Admins** - Granted by super admin
- **Server Admins** - Server owners (Manage Guild permission)

### ⚙️ Server Setup
Configure VaultRush for your server!

**Command:**
- `/setup updates_channel:#channel enable_wars:true/false`

**Settings:**
- **Updates Channel** - Where bot posts highlights and war results
- **War Enabled** - Opt in/out of Vault Wars

### 🔔 Bot Activity Feed
Hourly highlights posted to configured updates channel!

**Highlights Include:**
- Alliance milestones (100K, 500K, 1M, 5M coins)
- Big spenders (10K+ coins on upgrades)
- Massive contributions (50K+ to alliances)
- War results and rankings

## 📊 Complete Command List

### Vault & Economy
- `/collect` - Collect vault coins
- `/vault` - View vault stats
- `/upgrade type:rate/speed` - Upgrade vault

### Artifacts
- `/artifacts` - View collection
- `/vaultskin view/myskins/equip` - Manage skins

### Alliance
- `/alliance` - View server vault
- `/contribute amount` - Donate to alliance
- `/alliance-leaderboard` - Global rankings
- `/alliance-upgrade` - Upgrade server vault

### Trading & Market
- `/auction-create` - Create auction
- `/auction-bid` - Place bid
- `/auctions` - View active auctions
- `/market-buy` - Create buy order
- `/market-sell` - Create sell order
- `/market` - View market stats

### Loans
- `/loan` - Create loan
- `/payloan` - Repay loan
- `/myloans` - View your loans
- `/cancel-loan` - Cancel loan

### Mini-Games
- `/coinflip` - Bet on coin flip
- `/raid` - Raid player vault
- `/crate` - Open mystery crate

### Events & Wars
- `/events` - View active events
- `/war-rankings` - View war standings

### Leaderboards
- `/leaderboard` - Top players
- `/alliance-leaderboard` - Top alliances

### Admin & Setup
- `/setup` - Configure bot for server
- `/grant-admin` - Grant permissions
- `/revoke-admin` - Revoke permissions
- `/list-admins` - View admins

## 🎯 New Economy Balance

**Coin Sources:**
- Passive vault generation (capped at 6hrs)
- Winning mini-games
- Successful raids
- Loan repayments
- Alliance war victories

**Coin Sinks:**
- Vault upgrades (exponential costs)
- Alliance contributions (permanent)
- Loan interest payments
- Mystery crates
- Failed raids
- Lost coinflips

## 🔥 Pro Tips

1. **Stay Active:** Collect at least once every 6 hours to keep vault producing
2. **Server Power:** Contribute regularly to climb alliance leaderboard
3. **Loan Strategy:** Lend to trusted players for passive income
4. **War Preparation:** Build alliance power before Friday
5. **Skin Collection:** Hit coin milestones for automatic unlocks
6. **Setup Channel:** Configure updates channel for important notifications

---

**All data persists in PostgreSQL cloud database - no data loss!** 🚀
