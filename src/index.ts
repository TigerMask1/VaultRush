import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import { initializeDatabase } from './database/db';
import { scheduleRandomEvents, endExpiredEvents } from './systems/events';
import { finalizeExpiredAuctions } from './systems/auction';
import cron from 'node-cron';

import { collectCommand, vaultCommand, upgradeCommand } from './commands/vault-commands';
import { artifactsCommand } from './commands/artifact-commands';
import { auctionCreateCommand, auctionBidCommand, auctionsCommand } from './commands/auction-commands';
import { marketBuyCommand, marketSellCommand, marketCommand } from './commands/market-commands';
import { coinflipCommand, raidCommand, crateCommand, eventsCommand, leaderboardCommand } from './commands/game-commands';

dotenv.config();

interface ExtendedClient extends Client {
    commands: Collection<string, any>;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
}) as ExtendedClient;

client.commands = new Collection();

const commands = [
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
    coinflipCommand,
    raidCommand,
    crateCommand,
    eventsCommand,
    leaderboardCommand
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
        });
        
        console.log('✅ Event scheduler started');
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
        
        const errorMessage = '❌ There was an error executing this command!';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
