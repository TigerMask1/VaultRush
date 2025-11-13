import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getOrCreateUser } from '../database/db';
import { getOrCreateAlliance, contributeToAlliance, getAllianceInfo, getGlobalAllianceLeaderboard, upgradeAllianceVault } from '../systems/alliance';
import { checkAllianceMilestones } from '../systems/highlights';

export const allianceCommand = {
    data: new SlashCommandBuilder()
        .setName('alliance')
        .setDescription('View your server alliance vault information'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        if (!interaction.guildId) {
            await interaction.editReply('This command can only be used in a server!');
            return;
        }
        
        const alliance = await getOrCreateAlliance(interaction.guildId, interaction.guild?.name || 'Unknown');
        const info = await getAllianceInfo(interaction.guildId);
        
        if (!info) {
            await interaction.editReply('Alliance not found.');
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle(`🏰 ${info.guild_name} Alliance Vault`)
            .addFields(
                { name: '💰 Vault Coins', value: `${info.vault_coins.toLocaleString()}`, inline: true },
                { name: '⚡ Vault Level', value: `Level ${info.vault_level}`, inline: true },
                { name: '🔥 Vault Power', value: `${info.vault_power.toLocaleString()}`, inline: true },
                { name: '📊 Total Contributions', value: `${info.total_contributions.toLocaleString()} coins`, inline: true }
            );
        
        if (info.topContributors.length > 0) {
            const contributorList = info.topContributors
                .map((c: any, i: number) => `${i + 1}. **${c.username}**: ${parseInt(c.total_contributed).toLocaleString()} coins`)
                .join('\n');
            embed.addFields({ name: '🌟 Top Contributors', value: contributorList });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const contributeCommand = {
    data: new SlashCommandBuilder()
        .setName('contribute')
        .setDescription('Contribute coins to your server alliance vault')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of coins to contribute')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        if (!interaction.guildId) {
            await interaction.editReply('This command can only be used in a server!');
            return;
        }
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        await getOrCreateAlliance(interaction.guildId, interaction.guild?.name || 'Unknown');
        
        const amount = interaction.options.getInteger('amount', true);
        const result = await contributeToAlliance(interaction.guildId, interaction.user.id, amount);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const allianceInfo = await getAllianceInfo(interaction.guildId);
        const milestone = allianceInfo ? await checkAllianceMilestones(interaction.guildId, allianceInfo.vault_coins) : null;
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('💎 Contribution Successful!')
            .setDescription(`You contributed **${amount.toLocaleString()}** coins to the alliance vault!`)
            .addFields(
                { name: 'Alliance Vault', value: `${allianceInfo?.vault_coins.toLocaleString() || 0} coins`, inline: true },
                { name: 'Your Contribution Cannot Be Withdrawn', value: 'Contributions are permanent donations!', inline: false }
            )
            .setTimestamp();
        
        if (milestone) {
            embed.addFields({ name: '🎉 Milestone!', value: milestone });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const allianceLeaderboardCommand = {
    data: new SlashCommandBuilder()
        .setName('alliance-leaderboard')
        .setDescription('View the global alliance leaderboard'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const leaderboard = await getGlobalAllianceLeaderboard(10);
        
        if (leaderboard.length === 0) {
            await interaction.editReply('No alliances found yet!');
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 Global Alliance Leaderboard')
            .setDescription('Top 10 Alliances by Vault Power');
        
        leaderboard.forEach((alliance: any, index: number) => {
            embed.addFields({
                name: `#${index + 1} ${alliance.guild_name}`,
                value: `⚡ Power: ${alliance.vault_power.toLocaleString()} | 💰 Coins: ${alliance.vault_coins.toLocaleString()}`,
                inline: false
            });
        });
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const allianceUpgradeCommand = {
    data: new SlashCommandBuilder()
        .setName('alliance-upgrade')
        .setDescription('Upgrade your alliance vault (requires admin)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        if (!interaction.guildId) {
            await interaction.editReply('This command can only be used in a server!');
            return;
        }
        
        const result = await upgradeAllianceVault(interaction.guildId);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message || 'Upgrade failed'}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Alliance Vault Upgraded!')
            .addFields(
                { name: 'New Level', value: `${result.newLevel}`, inline: true },
                { name: 'Cost', value: `${result.cost?.toLocaleString() || 0} coins`, inline: true },
                { name: 'Power Gained', value: '+1000', inline: true }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};
