import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getOrCreateUser } from '../database/db';
import { pool } from '../database/db';

export const startCommand = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Register and start your VaultRush journey!'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const insertResult = await pool.query(
            `INSERT INTO users (discord_id, username, coins)
             VALUES ($1, $2, 1000)
             ON CONFLICT (discord_id) DO NOTHING
             RETURNING discord_id`,
            [interaction.user.id, interaction.user.username]
        );
        
        const isNewUser = insertResult.rows.length > 0;
        
        if (!isNewUser) {
            await pool.query(
                'UPDATE users SET username = $1 WHERE discord_id = $2',
                [interaction.user.username, interaction.user.id]
            );
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎮 Welcome to VaultRush!')
            .setDescription(
                isNewUser 
                    ? `Welcome, ${interaction.user.username}! You've been registered and received **1,000 starter coins**!` 
                    : `Welcome back, ${interaction.user.username}!`
            )
            .addFields(
                {
                    name: '💰 What is VaultRush?',
                    value: 'VaultRush is an idle economy game where you build and manage your own coin vault. Your vault generates coins automatically, even while you\'re offline!'
                },
                {
                    name: '🏦 Core Features',
                    value: '• **Vault System**: Passive coin generation\n• **Artifacts**: Collectible items with bonuses\n• **Stock Market**: Invest in other players\' vaults\n• **Mini-Games**: Earn coins through various games\n• **Alliance Vaults**: Team up with your server\n• **Trading**: Auction house & token market\n• **Vault Wars**: Weekly competitive events'
                },
                {
                    name: '🎯 Getting Started',
                    value: '1. Use `/collect` to gather coins from your vault\n2. Use `/vault` to view your stats\n3. Use `/upgrade` to improve your vault\n4. Play `/coinflip`, `/dice`, `/slots` to earn more coins\n5. Check `/help` for a full command list'
                },
                {
                    name: '🎲 Mini-Games Available',
                    value: '`/coinflip` • `/dice` • `/slots` • `/blackjack` • `/raid` • `/crate` • `/trivia` • `/daily` • `/roulette` • `/lottery` • `/rps` (rock-paper-scissors)'
                },
                {
                    name: '📈 Advanced Features',
                    value: '• **Stock Market**: `/stocks`, `/buy-shares`, `/sell-shares`\n• **Artifacts**: Boost your vault with rare items\n• **Auctions**: `/auction-create`, `/auctions`\n• **Loans**: Lend coins to other players\n• **Vault Skins**: Customize your vault appearance'
                },
                {
                    name: '🎮 Pro Tips',
                    value: '• Collect regularly to maximize earnings\n• Upgrade your vault rate and speed\n• Participate in events for bonuses\n• Join your server\'s alliance vault\n• Invest in top players\' vaults on the stock market'
                }
            )
            .setFooter({ text: 'Use /help for a complete command list' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};
