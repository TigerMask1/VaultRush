import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { isSuperAdmin, grantAdmin, revokeAdmin, listAdmins, updateServerSettings, getServerSettings } from '../systems/admin';
import { enableWarForAlliance } from '../systems/wars';

export const grantAdminCommand = {
    data: new SlashCommandBuilder()
        .setName('grant-admin')
        .setDescription('Grant admin permissions (super admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to grant admin permissions to')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        
        const isSuper = await isSuperAdmin(interaction.user.id);
        
        if (!isSuper) {
            await interaction.editReply('❌ Only super admins can use this command.');
            return;
        }
        
        const targetUser = interaction.options.getUser('user', true);
        const result = await grantAdmin(interaction.user.id, targetUser.id);
        
        await interaction.editReply(`${result.success ? '✅' : '❌'} ${result.message}`);
    }
};

export const revokeAdminCommand = {
    data: new SlashCommandBuilder()
        .setName('revoke-admin')
        .setDescription('Revoke admin permissions (super admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to revoke admin permissions from')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        
        const isSuper = await isSuperAdmin(interaction.user.id);
        
        if (!isSuper) {
            await interaction.editReply('❌ Only super admins can use this command.');
            return;
        }
        
        const targetUser = interaction.options.getUser('user', true);
        const result = await revokeAdmin(interaction.user.id, targetUser.id);
        
        await interaction.editReply(`${result.success ? '✅' : '❌'} ${result.message}`);
    }
};

export const listAdminsCommand = {
    data: new SlashCommandBuilder()
        .setName('list-admins')
        .setDescription('List all admins'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        
        const admins = await listAdmins();
        
        const embed = new EmbedBuilder()
            .setColor('#FF6347')
            .setTitle('👑 VaultRush Admins');
        
        const superAdmins = admins.filter((a: any) => a.is_super_admin);
        const regularAdmins = admins.filter((a: any) => !a.is_super_admin);
        
        if (superAdmins.length > 0) {
            const superAdminList = superAdmins.map((a: any) => 
                `<@${a.user_id}> ${a.username ? `(${a.username})` : ''}`
            ).join('\n');
            embed.addFields({ name: '🌟 Super Admins', value: superAdminList });
        }
        
        if (regularAdmins.length > 0) {
            const adminList = regularAdmins.map((a: any) => 
                `<@${a.user_id}> ${a.username ? `(${a.username})` : ''}`
            ).join('\n');
            embed.addFields({ name: '⚙️ Admins', value: adminList });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const setupCommand = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup VaultRush bot for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(option =>
            option.setName('updates_channel')
                .setDescription('Channel for bot updates and highlights')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('enable_wars')
                .setDescription('Enable Vault Wars for this server')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        if (!interaction.guildId) {
            await interaction.editReply('This command can only be used in a server!');
            return;
        }
        
        const updatesChannel = interaction.options.getChannel('updates_channel');
        const enableWars = interaction.options.getBoolean('enable_wars');
        
        const settings: any = {};
        if (updatesChannel) settings.updates_channel_id = updatesChannel.id;
        if (enableWars !== null) {
            settings.war_enabled = enableWars;
            await enableWarForAlliance(interaction.guildId, enableWars);
        }
        
        const result = await updateServerSettings(interaction.guildId, settings);
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Server Setup Complete!')
            .setDescription('VaultRush has been configured for this server!');
        
        if (updatesChannel) {
            embed.addFields({ 
                name: '📢 Updates Channel', 
                value: `<#${updatesChannel.id}>` 
            });
        }
        
        if (enableWars !== null) {
            embed.addFields({ 
                name: '⚔️ Vault Wars', 
                value: enableWars ? '✅ Enabled' : '❌ Disabled' 
            });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};
