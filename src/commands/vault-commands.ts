import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getOrCreateUser } from '../database/db';
import { collectCoins, upgradeVault, getVaultInfo } from '../systems/vault';
import { awardRandomArtifact } from '../systems/events';

export const collectCommand = {
    data: new SlashCommandBuilder()
        .setName('collect')
        .setDescription('Collect coins from your vault'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
        const result = await collectCoins(interaction.user.id);
        
        const artifact = await awardRandomArtifact(interaction.user.id);
        
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('💰 Vault Collection')
            .setDescription(`You collected **${result.collected.toLocaleString()}** coins!`)
            .addFields(
                { name: 'New Balance', value: `${result.newTotal.toLocaleString()} coins`, inline: true }
            )
            .setTimestamp();
        
        if (artifact) {
            embed.addFields({
                name: '🎁 Bonus Drop!',
                value: `You found a **${artifact.rarity}** artifact: ${artifact.name}!`
            });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const vaultCommand = {
    data: new SlashCommandBuilder()
        .setName('vault')
        .setDescription('View your vault information'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const info = await getVaultInfo(interaction.user.id);
        
        if (!info) {
            await interaction.editReply('Vault not found. Use /collect to initialize your vault.');
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle(`🏦 ${interaction.user.username}'s Vault`)
            .addFields(
                { name: '💰 Balance', value: `${info.coins.toLocaleString()} coins`, inline: true },
                { name: '⏳ Pending', value: `${info.pendingCoins.toLocaleString()} coins`, inline: true },
                { name: '🪙 Tokens', value: `${info.tokens} tokens`, inline: true },
                { name: '⚙️ Vault Level', value: `Level ${info.vaultLevel}`, inline: true },
                { name: '⚡ Speed Level', value: `Level ${info.speedLevel}`, inline: true },
                { name: '📈 Coins/Hour', value: `${info.coinsPerHour.toFixed(0)}`, inline: true },
                { name: '💎 Next Rate Upgrade', value: `${info.nextRateCost.toLocaleString()} coins`, inline: true },
                { name: '⚡ Next Speed Upgrade', value: `${info.nextSpeedCost.toLocaleString()} coins`, inline: true }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const upgradeCommand = {
    data: new SlashCommandBuilder()
        .setName('upgrade')
        .setDescription('Upgrade your vault')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of upgrade')
                .setRequired(true)
                .addChoices(
                    { name: 'Coin Rate (+50 coins/hour)', value: 'rate' },
                    { name: 'Speed (10% faster generation)', value: 'speed' }
                )),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const type = interaction.options.getString('type', true) as 'rate' | 'speed';
        
        const result = await upgradeVault(interaction.user.id, type);
        
        if (!result.success) {
            await interaction.editReply(`❌ Upgrade failed! Cost: ${result.cost.toLocaleString()} coins. You need more coins.`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Upgrade Successful!')
            .setDescription(`Your vault ${type} has been upgraded to level ${result.newLevel}!`)
            .addFields(
                { name: 'Cost', value: `${result.cost.toLocaleString()} coins`, inline: true },
                { name: 'New Level', value: `${result.newLevel}`, inline: true }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};
