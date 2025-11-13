import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getOrCreateUser } from '../database/db';
import { createMarketOrder, getMarketStats } from '../systems/market';

export const marketBuyCommand = {
    data: new SlashCommandBuilder()
        .setName('market-buy')
        .setDescription('Create a buy order for vault tokens')
        .addIntegerOption(option =>
            option.setName('tokens')
                .setDescription('Number of tokens to buy')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('price_per_token')
                .setDescription('Price per token in coins')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const tokens = interaction.options.getInteger('tokens', true);
        const pricePerToken = interaction.options.getInteger('price_per_token', true);
        
        const result = await createMarketOrder(interaction.user.id, 'buy', tokens, pricePerToken);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('📈 Buy Order Created')
            .addFields(
                { name: 'Tokens', value: `${tokens}`, inline: true },
                { name: 'Price per Token', value: `${pricePerToken} coins`, inline: true },
                { name: 'Total Cost', value: `${(tokens * pricePerToken).toLocaleString()} coins`, inline: true }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const marketSellCommand = {
    data: new SlashCommandBuilder()
        .setName('market-sell')
        .setDescription('Create a sell order for vault tokens')
        .addIntegerOption(option =>
            option.setName('tokens')
                .setDescription('Number of tokens to sell')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('price_per_token')
                .setDescription('Price per token in coins')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const tokens = interaction.options.getInteger('tokens', true);
        const pricePerToken = interaction.options.getInteger('price_per_token', true);
        
        const result = await createMarketOrder(interaction.user.id, 'sell', tokens, pricePerToken);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF6347')
            .setTitle('📉 Sell Order Created')
            .addFields(
                { name: 'Tokens', value: `${tokens}`, inline: true },
                { name: 'Price per Token', value: `${pricePerToken} coins`, inline: true },
                { name: 'Expected Return', value: `${(tokens * pricePerToken).toLocaleString()} coins`, inline: true }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const marketCommand = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('View market statistics'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const stats = await getMarketStats();
        
        const embed = new EmbedBuilder()
            .setColor('#1E90FF')
            .setTitle('📊 Vault Token Market')
            .addFields(
                { name: 'Current Market Price', value: `${stats.marketPrice} coins/token`, inline: true }
            );
        
        const buyOrders = stats.activeOrders.find((o: any) => o.order_type === 'buy');
        const sellOrders = stats.activeOrders.find((o: any) => o.order_type === 'sell');
        
        if (buyOrders) {
            embed.addFields({
                name: 'Active Buy Orders',
                value: `${buyOrders.count} orders for ${buyOrders.total_tokens || 0} tokens`,
                inline: true
            });
        }
        
        if (sellOrders) {
            embed.addFields({
                name: 'Active Sell Orders',
                value: `${sellOrders.count} orders for ${sellOrders.total_tokens || 0} tokens`,
                inline: true
            });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};
