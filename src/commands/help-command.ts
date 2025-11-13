import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const helpCommand = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all available commands and learn how to play')
        .addStringOption(option =>
            option.setName('section')
                .setDescription('Choose a help section')
                .setRequired(false)
                .addChoices(
                    { name: '🎮 Getting Started', value: 'getting_started' },
                    { name: '📖 All Commands', value: 'commands' },
                    { name: '🎲 Mini-Games Guide', value: 'minigames' },
                    { name: '📈 Stock Market Guide', value: 'stocks' },
                    { name: '💡 Tips & Strategies', value: 'tips' }
                )
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const section = interaction.options.getString('section') || 'getting_started';
        
        let embed: EmbedBuilder;
        
        if (section === 'getting_started') {
            embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎮 Welcome to VaultRush!')
                .setDescription('**Your Guide to Getting Started**\n\nVaultRush is a Discord economy game where you build your vault empire, play mini-games, trade stocks, and compete with other players!')
                .addFields(
                    {
                        name: '📝 Step 1: Register',
                        value: 'Use `/start` to create your account and receive **1,000 starter coins**. This is your one-time welcome bonus!'
                    },
                    {
                        name: '🏦 Step 2: Understand Your Vault',
                        value: 'Your vault **automatically generates coins** every hour (100 coins/hour base rate). Use `/collect` to gather your coins. Check `/vault` to see your stats and total earnings.'
                    },
                    {
                        name: '⬆️ Step 3: Upgrade Your Vault',
                        value: 'Use `/upgrade rate` to increase coins per hour\nUse `/upgrade speed` to collect more frequently\n\n**Tip:** Upgrades get more expensive as you level up, but the returns are worth it!'
                    },
                    {
                        name: '🎰 Step 4: Play Mini-Games',
                        value: '**Safe Games:** `/daily` (free daily reward), `/trivia` (test your knowledge)\n**Betting Games:** `/dice`, `/slots`, `/blackjack`, `/roulette`, `/rps`\n**PvP:** `/raid` (attack other players\' vaults)\n\n**Remember:** Only bet what you can afford to lose!'
                    },
                    {
                        name: '📈 Step 5: Invest in Stocks',
                        value: 'View available stocks with `/stocks`\nBuy shares in other players\' vaults to earn **daily dividends**\nSell shares when prices go up for profit!\n\n**Stock Tips:** Invest in active players with upgraded vaults'
                    },
                    {
                        name: '🎯 Quick Start Commands',
                        value: '`/start` → `/collect` → `/daily` → `/dice 100 7` → `/stocks`\n\nThat\'s it! You\'re ready to play. Use `/help commands` to see all available features.'
                    }
                )
                .setFooter({ text: 'Use /help commands to see all available commands | /help tips for strategies' })
                .setTimestamp();
        } else if (section === 'commands') {
            embed = new EmbedBuilder()
                .setColor('#4169E1')
                .setTitle('📖 VaultRush Command Guide')
                .setDescription('Here are all available commands organized by category:')
                .addFields(
                    {
                        name: '🏦 Vault Commands',
                        value: '`/start` - Register and get 1,000 starter coins\n`/collect` - Collect coins from your vault\n`/vault` - View your vault stats and earnings\n`/upgrade` - Upgrade vault rate or speed\n`/vaultskin` - Customize your vault appearance'
                    },
                    {
                        name: '🎲 Mini-Games',
                        value: '`/daily` - Claim daily reward (500-1,500 coins)\n`/dice <bet> <1-12>` - Roll dice, 10x payout for exact match\n`/slots <bet>` - Slot machine, 50x jackpot\n`/blackjack <bet>` - Beat the dealer, 2:1 payout\n`/roulette <bet> <color/type>` - Bet on roulette\n`/rps <bet> <choice>` - Rock-paper-scissors\n`/coinflip <bet> <heads/tails>` - Double or nothing\n`/trivia` - Answer questions for 200-500 coins\n`/lottery` - Buy ticket for 50,000 coin jackpot\n`/raid <@user>` - Steal from other players\n`/crate` - Open mystery crate (1,000 coins)'
                    },
                    {
                        name: '📈 Stock Market',
                        value: '`/list-stock` - List your vault on stock market\n`/stocks` - View all available vault stocks\n`/buy-shares <symbol> <qty>` - Buy stock shares\n`/sell-shares <symbol> <qty>` - Sell your shares\n`/portfolio` - View your stock holdings\n`/stock-info <symbol>` - Detailed stock info'
                    },
                    {
                        name: '✨ Artifacts & Trading',
                        value: '`/artifacts` - View your artifact collection\n`/auction-create` - Auction an artifact\n`/auction-bid` - Bid on active auctions\n`/auctions` - View all active auctions'
                    },
                    {
                        name: '🏰 Alliance & Competition',
                        value: '`/alliance` - View your server\'s alliance vault\n`/contribute <amount>` - Donate to alliance\n`/alliance-leaderboard` - Global server rankings\n`/war-rankings` - Weekly vault war standings\n`/leaderboard` - Richest players globally'
                    },
                    {
                        name: '💰 Economy',
                        value: '`/market` - Token market stats\n`/loan <@user> <amount>` - Lend coins with interest\n`/myloans` - View your loans\n`/events` - Check active bonus events'
                    }
                )
                .setFooter({ text: 'Use /help getting_started for beginner guide | /help minigames for game tips' })
                .setTimestamp();
        } else if (section === 'minigames') {
            embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('🎲 Mini-Games Strategy Guide')
                .setDescription('Learn how each game works and maximize your winnings!')
                .addFields(
                    {
                        name: '🎯 Dice (Best Odds!)',
                        value: '**How to play:** `/dice <bet> <prediction 1-12>`\n**Payouts:** \n• Exact match: 10x your bet 🎯\n• Close (±1): 2x your bet\n• Wrong: Lose bet\n\n**Strategy:** Bet on 6, 7, or 8 for highest probability. The 10x payout makes exact hits very rewarding!'
                    },
                    {
                        name: '🃏 Blackjack',
                        value: '**How to play:** `/blackjack <bet>`\n**Rules:** Get closer to 21 than dealer without going over\n**Payout:** 2:1 on win, 2.5:1 on blackjack\n\n**Strategy:** \n• Hit on 11 or less\n• Stand on 17 or more\n• Be cautious with 12-16'
                    },
                    {
                        name: '🎰 Slots',
                        value: '**How to play:** `/slots <bet>`\n**Payouts:**\n• 3 matching: 50x (JACKPOT!) 💰\n• 2 matching: 3x\n• No match: Lose bet\n\n**Tip:** Slots are pure luck, but the 50x jackpot makes it exciting! Bet small amounts frequently.'
                    },
                    {
                        name: '🎡 Roulette',
                        value: '**How to play:** `/roulette <bet> <red/black/even/odd>`\n**Payout:** 2x on correct guess\n\n**Strategy:** Simple 50/50 odds. Great for doubling small amounts safely.'
                    },
                    {
                        name: '🪙 Daily Reward (FREE!)',
                        value: '**How to play:** `/daily`\n**Reward:** 500-1,500 coins per day\n**Streak Bonus:** Claim daily for up to 7 days to get maximum rewards!\n\n**Pro Tip:** NEVER miss your daily! Set a reminder. This is free money!'
                    },
                    {
                        name: '⚔️ Raid (PvP)',
                        value: '**How to play:** `/raid <@user>`\n**Risk:** You can steal 10-30% of their coins OR lose some of yours\n\n**Strategy:** Raid players with high balances. Check `/leaderboard` first!'
                    },
                    {
                        name: '🎟️ Lottery',
                        value: '**How to play:** `/lottery`\n**Cost:** 1,000 coins per ticket\n**Jackpot:** 50,000 coins (when won, resets)\n\n**Tip:** Low odds, but life-changing reward. Only buy tickets when you\'re ahead!'
                    }
                )
                .setFooter({ text: 'Start small, learn the games, then increase your bets as you profit!' })
                .setTimestamp();
        } else if (section === 'stocks') {
            embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('📈 Stock Market Investment Guide')
                .setDescription('Learn how to build wealth through smart investing!')
                .addFields(
                    {
                        name: '💼 How the Stock Market Works',
                        value: 'Players can list their vaults as stocks. Other players buy shares to earn **daily dividends**. Stock prices change every 2 hours based on vault performance.'
                    },
                    {
                        name: '📊 Listing Your Vault',
                        value: '**Command:** `/list-stock`\n**Requirements:** Vault must be upgraded\n**Benefits:** \n• Get immediate cash from share sales\n• Other players invest in YOUR success\n• Your vault symbol appears on stock exchange'
                    },
                    {
                        name: '💰 Buying Stocks',
                        value: '**Command:** `/buy-shares <symbol> <quantity>`\n\n**What to look for:**\n✅ High vault level (upgraded = more coins)\n✅ Active players (check their activity)\n✅ Low price per share (room to grow)\n✅ Strong dividend history'
                    },
                    {
                        name: '💵 Earning Dividends',
                        value: 'Dividends are paid **daily** based on vault earnings.\n\n**Example:** You own 10 shares of a vault that generates 1,000 coins/day. You might earn 50-100 coins/day in dividends!\n\n**Compound Effect:** Reinvest dividends to buy more shares → earn more dividends → repeat!'
                    },
                    {
                        name: '📉 When to Sell',
                        value: '**Command:** `/sell-shares <symbol> <quantity>`\n\n**Sell when:**\n• Stock price increased significantly\n• Player becomes inactive\n• You need cash for vault upgrades\n• Better investment opportunities appear'
                    },
                    {
                        name: '🎯 Investment Strategies',
                        value: '**Diversify:** Don\'t put all coins in one stock\n**Long-term:** Hold quality stocks for daily dividends\n**Research:** Use `/stock-info` before buying\n**Track:** Check `/portfolio` regularly\n\n**Golden Rule:** Invest in vaults of active, upgraded players!'
                    }
                )
                .setFooter({ text: 'Start with small investments and learn as you go!' })
                .setTimestamp();
        } else if (section === 'tips') {
            embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('💡 Pro Tips & Strategies')
                .setDescription('Advanced strategies to maximize your wealth in VaultRush!')
                .addFields(
                    {
                        name: '🚀 Early Game Strategy (0-10,000 coins)',
                        value: '1. **Claim `/daily` every single day** for free coins\n2. **Collect from vault** every time it\'s ready\n3. **Upgrade your vault rate** first (more coins/hour)\n4. **Play safe mini-games** like dice with small bets\n5. **Save for your first stock investment**'
                    },
                    {
                        name: '⚡ Mid Game Strategy (10,000-100,000 coins)',
                        value: '1. **Upgrade both rate AND speed** for maximum generation\n2. **Diversify:** 50% vault upgrades, 30% stocks, 20% gaming\n3. **Buy shares** in 3-5 different high-quality vaults\n4. **List your own vault** on stock market for extra capital\n5. **Use artifacts** from crates for passive bonuses'
                    },
                    {
                        name: '👑 Late Game Strategy (100,000+ coins)',
                        value: '1. **Focus on passive income** (vault + dividends)\n2. **Max out vault upgrades** for exponential growth\n3. **Build a stock portfolio** earning 5,000+ coins/day\n4. **Participate in Vault Wars** for exclusive rewards\n5. **Help alliance** to unlock powerful boosts'
                    },
                    {
                        name: '⚠️ Common Mistakes to Avoid',
                        value: '❌ Betting all your coins on risky games\n❌ Ignoring daily rewards (free money!)\n❌ Not upgrading your vault early\n❌ Buying stocks in inactive players\n❌ Forgetting to collect from your vault\n❌ Missing Vault Wars (easy rewards)'
                    },
                    {
                        name: '🎲 Gambling Smart',
                        value: '**The 10% Rule:** Never bet more than 10% of your balance on one game.\n\n**Bankroll Management:**\n• Set a daily gambling budget\n• Stop when you hit your limit\n• Always keep coins for vault upgrades\n• Use winnings to invest, not to gamble more'
                    },
                    {
                        name: '💎 Hidden Features',
                        value: '• **Vault Skins:** Unlock with `/vaultskin` for style points\n• **Events:** Golden Hour gives 2x coins - play during events!\n• **Loans:** Lend to friends with `/loan` for interest income\n• **Alliances:** Server vaults provide shared bonuses\n• **Artifacts:** Rare items from crates give permanent buffs'
                    },
                    {
                        name: '🏆 Path to Top 10 Leaderboard',
                        value: '1. Play daily for 30+ days (consistency wins)\n2. Max vault upgrades (compound growth)\n3. Build dividend portfolio (passive income)\n4. Win Vault Wars (bonus rewards)\n5. Smart gambling (grow capital, not lose it)\n6. Stay active (inactive vaults stop producing!)'
                    }
                )
                .setFooter({ text: 'Remember: Patience and consistency beat risky gambling!' })
                .setTimestamp();
        } else {
            embed = new EmbedBuilder()
                .setColor('#4169E1')
                .setTitle('📖 VaultRush Help')
                .setDescription('Use `/help` with one of these sections for detailed information!');
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};
