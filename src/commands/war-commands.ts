import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getWarRankings, getCurrentWeekNumber } from '../systems/wars';

export const warRankingsCommand = {
    data: new SlashCommandBuilder()
        .setName('war-rankings')
        .setDescription('View current Vault Wars rankings')
        .addIntegerOption(option =>
            option.setName('week')
                .setDescription('Week number (default: current week)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const weekNumber = interaction.options.getInteger('week') || getCurrentWeekNumber();
        const rankings = await getWarRankings(weekNumber);
        
        if (rankings.length === 0) {
            await interaction.editReply(`No Vault Wars rankings found for week ${weekNumber}.`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle(`⚔️ Vault Wars - Week ${weekNumber}`)
            .setDescription('Top 10 alliances competing for dominance!');
        
        rankings.forEach((war: any, index: number) => {
            let statusEmoji = war.rank ? `#${war.rank}` : '⏳';
            if (war.rank === 1) statusEmoji = '🥇';
            else if (war.rank === 2) statusEmoji = '🥈';
            else if (war.rank === 3) statusEmoji = '🥉';
            
            const coins = war.coins_won > 0 ? `+${war.coins_won.toLocaleString()}` : war.coins_lost > 0 ? `-${war.coins_lost.toLocaleString()}` : '0';
            
            embed.addFields({
                name: `${statusEmoji} ${war.guild_name}`,
                value: `⚡ Power: ${war.vault_power.toLocaleString()} | 💰 ${coins} coins`,
                inline: false
            });
        });
        
        embed.setFooter({ text: 'Wars conclude every Friday at midnight UTC' });
        
        await interaction.editReply({ embeds: [embed] });
    }
};
