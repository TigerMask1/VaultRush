import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getOrCreateUser } from '../database/db';
import { getUserArtifacts, getRarityEmoji } from '../systems/artifacts';

export const artifactsCommand = {
    data: new SlashCommandBuilder()
        .setName('artifacts')
        .setDescription('View your artifact collection'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const artifacts = await getUserArtifacts(interaction.user.id);
        
        if (artifacts.length === 0) {
            await interaction.editReply('You don\'t have any artifacts yet. Collect coins during events to find them!');
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle(`✨ ${interaction.user.username}'s Artifact Collection`)
            .setDescription(`Total Artifacts: ${artifacts.length}`);
        
        const rarityCounts = {
            'Common': 0,
            'Rare': 0,
            'Epic': 0,
            'Legendary': 0
        };
        
        artifacts.forEach(a => rarityCounts[a.rarity as keyof typeof rarityCounts]++);
        
        embed.addFields(
            { name: '⚪ Common', value: `${rarityCounts.Common}`, inline: true },
            { name: '🔵 Rare', value: `${rarityCounts.Rare}`, inline: true },
            { name: '🟣 Epic', value: `${rarityCounts.Epic}`, inline: true },
            { name: '🟡 Legendary', value: `${rarityCounts.Legendary}`, inline: true }
        );
        
        const topArtifacts = artifacts.slice(0, 5);
        const artifactList = topArtifacts.map(a => 
            `${getRarityEmoji(a.rarity)} **${a.name}** - ${a.description}`
        ).join('\n');
        
        if (artifactList) {
            embed.addFields({ name: 'Top Artifacts', value: artifactList });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};
