import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const helpCommand = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all available commands and features'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('📖 VaultRush Command Guide')
            .setDescription('Here are all available commands organized by category:')
            .addFields(
                {
                    name: '🏦 Vault Commands',
                    value: '`/start` - Register and get started\n`/collect` - Collect coins from your vault\n`/vault` - View your vault stats\n`/upgrade` - Upgrade vault rate or speed\n`/vaultskin` - Customize your vault appearance'
                },
                {
                    name: '🎲 Mini-Games',
                    value: '`/coinflip` - Double or nothing coin flip\n`/dice` - Roll dice and bet on outcomes\n`/slots` - Spin the slot machine\n`/blackjack` - Play blackjack against the dealer\n`/roulette` - Bet on the roulette wheel\n`/rps` - Play rock-paper-scissors\n`/trivia` - Answer trivia questions\n`/daily` - Claim daily rewards\n`/lottery` - Buy lottery tickets\n`/raid` - Raid other players\' vaults\n`/crate` - Open mystery crates'
                },
                {
                    name: '📈 Stock Market',
                    value: '`/stocks` - View available vault stocks\n`/buy-shares` - Invest in another player\'s vault\n`/sell-shares` - Sell your stock shares\n`/portfolio` - View your stock investments\n`/stock-info` - Detailed info about a stock'
                },
                {
                    name: '✨ Artifacts & Trading',
                    value: '`/artifacts` - View your collection\n`/auction-create` - Auction an artifact\n`/auction-bid` - Bid on an auction\n`/auctions` - View active auctions'
                },
                {
                    name: '🪙 Token Market',
                    value: '`/market` - View market stats\n`/market-buy` - Create buy order\n`/market-sell` - Create sell order'
                },
                {
                    name: '🏰 Alliance Features',
                    value: '`/alliance` - View your server\'s alliance\n`/contribute` - Donate to alliance vault\n`/alliance-leaderboard` - Global rankings\n`/alliance-upgrade` - Upgrade alliance'
                },
                {
                    name: '💰 Loans',
                    value: '`/loan` - Lend coins to another player\n`/payloan` - Repay a loan\n`/myloans` - View all your loans\n`/cancel-loan` - Cancel an unpaid loan'
                },
                {
                    name: '⚔️ Vault Wars & Events',
                    value: '`/war-rankings` - View war rankings\n`/events` - Check active events\n`/leaderboard` - Top richest players'
                },
                {
                    name: '⚙️ Admin Commands',
                    value: '`/setup` - Configure server settings\n`/grant-admin` - Grant admin permissions\n`/revoke-admin` - Revoke permissions\n`/list-admins` - View all admins'
                }
            )
            .setFooter({ text: 'For more details on any command, use it and see the options!' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};
