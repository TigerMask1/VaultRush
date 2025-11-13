import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getOrCreateUser } from '../database/db';
import { createAuction, placeBid, getActiveAuctions } from '../systems/auction';
import { getRarityEmoji } from '../systems/artifacts';

export const auctionCreateCommand = {
    data: new SlashCommandBuilder()
        .setName('auction-create')
        .setDescription('Create an auction for your artifact')
        .addIntegerOption(option =>
            option.setName('artifact_id')
                .setDescription('The ID of the artifact to auction')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('starting_bid')
                .setDescription('Starting bid in coins')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes (default 60)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const artifactId = interaction.options.getInteger('artifact_id', true);
        const startingBid = interaction.options.getInteger('starting_bid', true);
        const duration = interaction.options.getInteger('duration') || 60;
        
        const result = await createAuction(artifactId, interaction.user.id, startingBid, duration);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🔨 Auction Created!')
            .setDescription(`Your auction has been created successfully!`)
            .addFields(
                { name: 'Auction ID', value: `${result.auction.id}`, inline: true },
                { name: 'Starting Bid', value: `${startingBid.toLocaleString()} coins`, inline: true },
                { name: 'Duration', value: `${duration} minutes`, inline: true }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const auctionBidCommand = {
    data: new SlashCommandBuilder()
        .setName('auction-bid')
        .setDescription('Place a bid on an auction')
        .addIntegerOption(option =>
            option.setName('auction_id')
                .setDescription('The ID of the auction')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('bid_amount')
                .setDescription('Your bid amount in coins')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const auctionId = interaction.options.getInteger('auction_id', true);
        const bidAmount = interaction.options.getInteger('bid_amount', true);
        
        const result = await placeBid(auctionId, interaction.user.id, bidAmount);
        
        const embed = new EmbedBuilder()
            .setColor(result.success ? '#00FF00' : '#FF0000')
            .setTitle(result.success ? '✅ Bid Placed!' : '❌ Bid Failed')
            .setDescription(result.message)
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const auctionsCommand = {
    data: new SlashCommandBuilder()
        .setName('auctions')
        .setDescription('View active auctions'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const auctions = await getActiveAuctions();
        
        if (auctions.length === 0) {
            await interaction.editReply('No active auctions at the moment.');
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF8C00')
            .setTitle('🔨 Active Auctions')
            .setDescription(`${auctions.length} auction(s) available`);
        
        auctions.slice(0, 5).forEach(auction => {
            const endsIn = Math.floor((new Date(auction.ends_at).getTime() - Date.now()) / 60000);
            embed.addFields({
                name: `#${auction.id} - ${getRarityEmoji(auction.rarity)} ${auction.name}`,
                value: `Current Bid: ${auction.current_bid.toLocaleString()} coins\nSeller: ${auction.seller_name}\nEnds in: ${endsIn} minutes`,
                inline: false
            });
        });
        
        await interaction.editReply({ embeds: [embed] });
    }
};
