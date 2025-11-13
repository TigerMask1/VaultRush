import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getOrCreateUser } from '../database/db';
import { getAvailableSkins, getUserSkins, equipSkin, getEquippedSkin } from '../systems/skins';

export const vaultSkinCommand = {
    data: new SlashCommandBuilder()
        .setName('vaultskin')
        .setDescription('Manage your vault skins')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View all available vault skins'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('equip')
                .setDescription('Equip a vault skin')
                .addIntegerOption(option =>
                    option.setName('skin_id')
                        .setDescription('The ID of the skin to equip')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('myskins')
                .setDescription('View your unlocked skins')),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'view') {
            const skins = await getAvailableSkins();
            
            const embed = new EmbedBuilder()
                .setColor('#FF1493')
                .setTitle('💎 Available Vault Skins')
                .setDescription('Unlock skins by reaching milestones or winning events!');
            
            skins.forEach((skin: any) => {
                embed.addFields({
                    name: `${skin.id}. ${skin.name} (${skin.rarity})`,
                    value: `${skin.description}\n**Unlock:** ${skin.unlock_requirement}\n**Image:** ${skin.image_url}`,
                    inline: false
                });
            });
            
            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'equip') {
            const skinId = interaction.options.getInteger('skin_id', true);
            const result = await equipSkin(interaction.user.id, skinId);
            
            if (!result.success) {
                await interaction.editReply(`❌ ${result.message}`);
                return;
            }
            
            await interaction.editReply(`✅ Vault skin equipped successfully!`);
        } else if (subcommand === 'myskins') {
            const skins = await getUserSkins(interaction.user.id);
            
            if (skins.length === 0) {
                await interaction.editReply('You haven\'t unlocked any vault skins yet! Use /vaultskin view to see how to unlock them.');
                return;
            }
            
            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('✨ Your Vault Skins')
                .setDescription(`You have unlocked ${skins.length} skin(s)!`);
            
            skins.forEach((skin: any) => {
                const equipped = skin.equipped ? '✅ **EQUIPPED**' : '';
                embed.addFields({
                    name: `${skin.id}. ${skin.name} ${equipped}`,
                    value: `${skin.description}\nUnlocked: <t:${Math.floor(new Date(skin.unlocked_at).getTime() / 1000)}:R>`,
                    inline: false
                });
            });
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};
