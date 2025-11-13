import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import express from 'express';
import { initializeDatabase } from './database/db';
import { scheduleRandomEvents, endExpiredEvents } from './systems/events';
import { finalizeExpiredAuctions } from './systems/auction';
import { startVaultWar, finalizeVaultWar, getCurrentWeekNumber } from './systems/wars';
import { autoDeductOverdueLoans } from './systems/loans';
import { generateHourlyHighlights } from './systems/highlights';
import { getServerSettings } from './systems/admin';
import cron from 'node-cron';

import { collectCommand, vaultCommand, upgradeCommand } from './commands/vault-commands';
import { startCommand } from './commands/start-command';
import { helpCommand } from './commands/help-command';
import { artifactsCommand } from './commands/artifact-commands';
import { auctionCreateCommand, auctionBidCommand, auctionsCommand } from './commands/auction-commands';
import { marketBuyCommand, marketSellCommand, marketCommand } from './commands/market-commands';
import { coinflipCommand, raidCommand, crateCommand, eventsCommand, leaderboardCommand } from './commands/game-commands';
import { diceCommand, blackjackCommand, slotsCommand, dailyCommand, triviaCommand, rouletteCommand, lotteryCommand, rpsCommand } from './commands/new-minigames';
import { allianceCommand, contributeCommand, allianceLeaderboardCommand, allianceUpgradeCommand } from './commands/alliance-commands';
import { loanCommand, payLoanCommand, myLoansCommand, cancelLoanCommand } from './commands/loan-commands';
import { vaultSkinCommand } from './commands/skin-commands';
import { grantAdminCommand, revokeAdminCommand, listAdminsCommand, setupCommand } from './commands/admin-commands';
import { warRankingsCommand } from './commands/war-commands';
import { listStockCommand, stocksCommand, buySharesCommand, sellSharesCommand, portfolioCommand, stockInfoCommand } from './commands/stock-commands';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: 'VaultRush',
        version: '2.0.0',
        message: 'VaultRush Discord Bot is running! 🎮',
        features: [
            'Vault System with Passive Income',
            'Stock Market Trading',
            'Mini-Games (Dice, Blackjack, Slots, Roulette, etc.)',
            'Artifact Collection & Auctions',
            'Alliance System & Vault Wars',
            'Loan System',
            'Daily Rewards & Events'
        ],
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString() 
    });
});

app.get('/stats', (req, res) => {
    if (!client || !client.isReady()) {
        return res.json({
            guilds: 0,
            users: 0,
            commands: 0,
            uptime: process.uptime(),
            ready: false,
            message: 'Bot is starting up...'
        });
    }
    
    res.json({
        guilds: client.guilds?.cache.size || 0,
        users: client.users?.cache.size || 0,
        commands: commands.length,
        uptime: process.uptime(),
        ready: true
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Web server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

interface ExtendedClient extends Client {
    commands: Collection<string, any>;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
}) as ExtendedClient;

client.commands = new Collection();

const commands = [
    startCommand,
    helpCommand,
    collectCommand,
    vaultCommand,
    upgradeCommand,
    artifactsCommand,
    auctionCreateCommand,
    auctionBidCommand,
    auctionsCommand,
    marketBuyCommand,
    marketSellCommand,
    marketCommand,
    listStockCommand,
    stocksCommand,
    buySharesCommand,
    sellSharesCommand,
    portfolioCommand,
    stockInfoCommand,
    coinflipCommand,
    diceCommand,
    blackjackCommand,
    slotsCommand,
    dailyCommand,
    triviaCommand,
    rouletteCommand,
    lotteryCommand,
    rpsCommand,
    raidCommand,
    crateCommand,
    eventsCommand,
    leaderboardCommand,
    allianceCommand,
    contributeCommand,
    allianceLeaderboardCommand,
    allianceUpgradeCommand,
    loanCommand,
    payLoanCommand,
    myLoansCommand,
    cancelLoanCommand,
    vaultSkinCommand,
    grantAdminCommand,
    revokeAdminCommand,
    listAdminsCommand,
    setupCommand,
    warRankingsCommand
];

commands.forEach(command => {
    client.commands.set(command.data.name, command);
});

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user?.tag}`);
    
    try {
        await initializeDatabase();
        console.log('✅ Database initialized');
        
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN!);
        
        const commandData = commands.map(cmd => cmd.data.toJSON());
        
        console.log('🔄 Registering slash commands...');
        await rest.put(
            Routes.applicationCommands(client.user!.id),
            { body: commandData }
        );
        console.log('✅ Slash commands registered successfully');
        
        scheduleRandomEvents((message: string) => {
            client.guilds.cache.forEach(guild => {
                const channel = guild.channels.cache.find(ch => ch.name === 'general' || ch.name === 'vaultrush');
                if (channel && channel.isTextBased()) {
                    channel.send(message);
                }
            });
        });
        
        cron.schedule('*/5 * * * *', async () => {
            await endExpiredEvents();
            await finalizeExpiredAuctions();
            await autoDeductOverdueLoans();
        });
        
        cron.schedule('0 */2 * * *', async () => {
            try {
                const stocksModule = await import('./systems/stocks');
                await stocksModule.updateStockPrices();
                console.log('📈 Stock prices updated');
            } catch (error) {
                console.error('Error updating stock prices:', error);
            }
        });
        
        cron.schedule('0 0 * * *', async () => {
            try {
                const stocksModule = await import('./systems/stocks');
                await stocksModule.payDividends();
                console.log('💰 Dividends paid to stockholders');
            } catch (error) {
                console.error('Error paying dividends:', error);
            }
        });
        
        cron.schedule('0 * * * *', async () => {
            const highlights = await generateHourlyHighlights();
            
            for (const highlight of highlights) {
                client.guilds.cache.forEach(async guild => {
                    const settings = await getServerSettings(guild.id);
                    if (settings?.updates_channel_id) {
                        const channel = guild.channels.cache.get(settings.updates_channel_id);
                        if (channel && channel.isTextBased()) {
                            await channel.send(highlight.message);
                        }
                    }
                });
            }
            
            const { getInactiveUsers } = require('./systems/maintenance');
            const inactiveUsers = await getInactiveUsers();
            
            const userGuilds = new Map();
            for (const user of inactiveUsers) {
                for (const guild of client.guilds.cache.values()) {
                    try {
                        await guild.members.fetch();
                    } catch (error) {
                        console.error(`Failed to fetch members for guild ${guild.id}`);
                    }
                    const member = guild.members.cache.get(user.discord_id);
                    if (member) {
                        if (!userGuilds.has(user.discord_id)) {
                            userGuilds.set(user.discord_id, []);
                        }
                        userGuilds.get(user.discord_id).push(guild);
                    }
                }
            }
            
            for (const user of inactiveUsers) {
                const guilds = userGuilds.get(user.discord_id) || [];
                
                if (guilds.length > 0) {
                    for (const guild of guilds) {
                        const settings = await getServerSettings(guild.id);
                        if (settings?.updates_channel_id) {
                            const channel = guild.channels.cache.get(settings.updates_channel_id);
                            if (channel && channel.isTextBased()) {
                                await channel.send(`⚠️ **Inactivity Alert:** <@${user.discord_id}>'s vault stopped producing coins due to 6 hours of inactivity. Use any command to restart production!`);
                            }
                        }
                    }
                } else {
                    try {
                        const dmUser = await client.users.fetch(user.discord_id);
                        await dmUser.send(`⚠️ **Vault Maintenance Alert**\n\nYour vault has stopped producing coins after 6 hours of inactivity!\n\nUse any command in a VaultRush server to restart production immediately.`);
                    } catch (error) {
                        console.log(`Could not send DM to inactive user ${user.discord_id}`);
                    }
                }
            }
        });
        
        cron.schedule('0 0 * * 1', async () => {
            await startVaultWar();
            console.log('🔥 New Vault War started!');
        });
        
        cron.schedule('0 0 * * 5', async () => {
            const results = await finalizeVaultWar();
            console.log('⚔️ Vault War finalized!', results);
            
            client.guilds.cache.forEach(async guild => {
                const settings = await getServerSettings(guild.id);
                if (settings?.updates_channel_id && settings?.war_enabled) {
                    const channel = guild.channels.cache.get(settings.updates_channel_id);
                    if (channel && channel.isTextBased()) {
                        await channel.send(`⚔️ **VAULT WARS WEEK ${getCurrentWeekNumber() - 1} CONCLUDED!**\nUse /war-rankings to see the results!`);
                    }
                }
            });
        });
        
        console.log('✅ Event scheduler started');
        console.log('✅ War scheduler started');
        console.log('✅ Highlights scheduler started');
        console.log('🎮 VaultRush is now running!');
        
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    
    if (!command) return;
    
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        
        try {
            const errorMessage = '❌ There was an error executing this command!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        } catch (replyError) {
            console.error('Could not send error message (interaction expired):', replyError);
        }
    } finally {
        const { updateUserActivity } = require('./systems/maintenance');
        updateUserActivity(interaction.user.id).catch((err: any) => {
            console.error('Error updating user activity:', err);
        });
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.mentions.has(client.user!.id)) return;
    
    const content = message.content.replace(`<@${client.user!.id}>`, '').trim();
    const args = content.split(' ');
    const commandName = args[0]?.toLowerCase();
    
    if (!commandName) {
        await message.reply('👋 Hi! Use commands like: `@VaultRush collect`, `@VaultRush vault`, `@VaultRush help`\nOr use slash commands: `/collect`, `/vault`, `/help`');
        return;
    }
    
    const commandMap: { [key: string]: string } = {
        'collect': 'collect',
        'vault': 'vault',
        'start': 'start',
        'help': 'help',
        'upgrade': 'upgrade',
        'artifacts': 'artifacts',
        'stocks': 'stocks',
        'portfolio': 'portfolio',
        'coinflip': 'coinflip',
        'flip': 'coinflip',
        'raid': 'raid',
        'crate': 'crate',
        'daily': 'daily',
        'dice': 'dice',
        'slots': 'slots',
        'blackjack': 'blackjack',
        'bj': 'blackjack',
        'roulette': 'roulette',
        'lottery': 'lottery',
        'trivia': 'trivia',
        'rps': 'rps',
        'leaderboard': 'leaderboard',
        'lb': 'leaderboard',
        'events': 'events',
        'alliance': 'alliance',
        'market': 'market'
    };
    
    const actualCommandName = commandMap[commandName];
    
    if (!actualCommandName) {
        await message.reply(`❌ Unknown command: **${commandName}**\nUse \`@VaultRush help\` to see all available commands!`);
        return;
    }
    
    const command = client.commands.get(actualCommandName);
    
    if (!command) {
        await message.reply(`❌ Command not found! Use \`@VaultRush help\` for available commands.`);
        return;
    }
    
    try {
        const { updateUserActivity } = require('./systems/maintenance');
        await updateUserActivity(message.author.id);
        
        const mockInteraction = {
            deferReply: async () => {
                await message.channel.sendTyping();
            },
            editReply: async (content: any) => {
                await message.reply(content);
            },
            reply: async (content: any) => {
                await message.reply(content);
            },
            user: message.author,
            options: {
                getString: () => null,
                getInteger: () => null,
                getUser: () => null
            }
        };
        
        await command.execute(mockInteraction);
    } catch (error) {
        console.error('Error executing @mention command:', error);
        await message.reply('❌ There was an error executing this command!');
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
