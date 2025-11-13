import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getOrCreateUser, pool } from '../database/db';
import { playCoinFlip, attemptVaultRaid, openMysteryCrate } from '../systems/minigames';
import { getActiveEvents } from '../systems/events';
import { getRarityEmoji } from '../systems/artifacts';

export const coinflipCommand = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin and bet on the outcome')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Amount to bet')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Your choice')
                .setRequired(true)
                .addChoices(
                    { name: 'Heads', value: 'heads' },
                    { name: 'Tails', value: 'tails' }
                )),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const bet = interaction.options.getInteger('bet', true);
        const choice = interaction.options.getString('choice', true) as 'heads' | 'tails';
        
        const result = await playCoinFlip(interaction.user.id, bet, choice);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor(result.won ? '#00FF00' : '#FF0000')
            .setTitle('🪙 Coin Flip!')
            .setDescription(`The coin landed on: **${result.result?.toUpperCase() || 'Unknown'}**`)
            .addFields(
                { name: 'Result', value: result.won ? '✅ You Won!' : '❌ You Lost', inline: true },
                { name: 'Amount', value: `${result.winAmount?.toLocaleString() || 0} coins`, inline: true },
                { name: 'New Balance', value: `${result.newBalance?.toLocaleString() || 0} coins`, inline: true }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const raidCommand = {
    data: new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Raid another player\'s vault')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The player to raid')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const target = interaction.options.getUser('target', true);
        await getOrCreateUser(target.id, target.username);
        
        const result = await attemptVaultRaid(interaction.user.id, target.id);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor(result.won ? '#00FF00' : '#FF0000')
            .setTitle('⚔️ Vault Raid!')
            .setDescription(result.message)
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const crateCommand = {
    data: new SlashCommandBuilder()
        .setName('crate')
        .setDescription('Open a mystery crate (costs 1000 coins)'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const result = await openMysteryCrate(interaction.user.id);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('📦 Mystery Crate Opened!');
        
        if (result.reward.type === 'coins') {
            embed.setDescription(`You received **${result.reward.amount.toLocaleString()} coins**! 💰`);
        } else if (result.reward.type === 'tokens') {
            embed.setDescription(`You received **${result.reward.amount} Vault Tokens**! 🪙`);
        } else if (result.reward.type === 'artifact') {
            const artifact = result.reward.artifact;
            embed.setDescription(`You found a ${getRarityEmoji(artifact.rarity)} **${artifact.rarity}** artifact!\n\n**${artifact.name}**\n${artifact.description}`);
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const eventsCommand = {
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('View active events'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const events = await getActiveEvents();
        
        if (events.length === 0) {
            await interaction.editReply('No active events right now. Check back soon!');
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF1493')
            .setTitle('🎉 Active Events');
        
        events.forEach(event => {
            const endsIn = Math.floor((new Date(event.ends_at).getTime() - Date.now()) / 60000);
            embed.addFields({
                name: event.event_type.toUpperCase().replace('_', ' '),
                value: `${event.description}\nEnds in: ${endsIn} minutes`,
                inline: false
            });
        });
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const leaderboardCommand = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top players'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const topPlayers = await pool.query(
            `SELECT username, coins, vault_level, 
             (SELECT COUNT(*) FROM artifacts WHERE owner_id = users.discord_id) as artifact_count
             FROM users 
             ORDER BY coins DESC 
             LIMIT 10`
        );
        
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 VaultRush Leaderboard')
            .setDescription('Top 10 Richest Players');
        
        topPlayers.rows.forEach((player, index) => {
            embed.addFields({
                name: `#${index + 1} ${player.username}`,
                value: `💰 ${player.coins.toLocaleString()} coins | ⚙️ Vault Lv.${player.vault_level} | ✨ ${player.artifact_count} artifacts`,
                inline: false
            });
        });
        
        await interaction.editReply({ embeds: [embed] });
    }
};
