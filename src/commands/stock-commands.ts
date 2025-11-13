import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getOrCreateUser } from '../database/db';
import { 
    createVaultStock, 
    buyShares, 
    sellShares, 
    getStockMarketInfo, 
    getStockInfo, 
    getUserPortfolio 
} from '../systems/stocks';

export const listStockCommand = {
    data: new SlashCommandBuilder()
        .setName('list-stock')
        .setDescription('List your vault on the stock market for public trading'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const result = await createVaultStock(interaction.user.id, interaction.user.username);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('📈 Stock Listed Successfully!')
            .setDescription(`Your vault is now publicly traded on the stock market!`)
            .addFields(
                { name: 'Stock Symbol', value: result.stock.stock_symbol, inline: true },
                { name: 'Company Name', value: result.stock.company_name, inline: true },
                { name: 'Initial Price', value: `${result.stock.current_price.toLocaleString()} coins/share`, inline: true },
                { name: 'Total Shares', value: result.stock.total_shares.toLocaleString(), inline: true },
                { name: 'Market Cap', value: `${result.stock.market_cap.toLocaleString()} coins`, inline: true },
                { name: 'Dividend Rate', value: `${(result.stock.dividend_rate * 100).toFixed(1)}% daily`, inline: true }
            )
            .setFooter({ text: 'Other players can now invest in your vault!' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const stocksCommand = {
    data: new SlashCommandBuilder()
        .setName('stocks')
        .setDescription('View all available vault stocks on the market'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const stocks = await getStockMarketInfo();
        
        if (stocks.length === 0) {
            await interaction.editReply('📊 No stocks available on the market yet! Use `/list-stock` to be the first!');
            return;
        }
        
        const stockList = stocks.map((stock, index) => {
            const changeEmoji = stock.price_change_24h >= 0 ? '📈' : '📉';
            const changeColor = stock.price_change_24h >= 0 ? '+' : '';
            return `**${index + 1}. ${stock.stock_symbol}** - ${stock.company_name}\n` +
                   `💰 Price: ${stock.current_price.toLocaleString()} coins | ` +
                   `${changeEmoji} ${changeColor}${stock.price_change_24h.toFixed(2)}%\n` +
                   `📊 Available: ${stock.shares_available.toLocaleString()} shares | ` +
                   `⚡ Vault Rate: ${stock.coins_per_hour.toFixed(0)}/hr`;
        }).join('\n\n');
        
        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('📈 VaultRush Stock Market')
            .setDescription(stockList)
            .setFooter({ text: 'Use /buy-shares <symbol> <quantity> to invest' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const buySharesCommand = {
    data: new SlashCommandBuilder()
        .setName('buy-shares')
        .setDescription('Buy shares of a vault stock')
        .addStringOption(option =>
            option.setName('symbol')
                .setDescription('Stock symbol (e.g., JOHN42)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantity')
                .setDescription('Number of shares to buy')
                .setRequired(true)
                .setMinValue(1)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const symbol = interaction.options.getString('symbol', true).toUpperCase();
        const quantity = interaction.options.getInteger('quantity', true);
        
        const result = await buyShares(interaction.user.id, symbol, quantity);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Shares Purchased!')
            .setDescription(`You successfully bought **${result.quantity} shares** of **${result.stockSymbol}**!`)
            .addFields(
                { name: 'Price per Share', value: `${result.pricePerShare!.toLocaleString()} coins`, inline: true },
                { name: 'Total Cost', value: `${result.totalCost!.toLocaleString()} coins`, inline: true },
                { name: 'Shares Owned', value: `${result.quantity}`, inline: true }
            )
            .setFooter({ text: 'Check your portfolio with /portfolio' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const sellSharesCommand = {
    data: new SlashCommandBuilder()
        .setName('sell-shares')
        .setDescription('Sell your vault stock shares')
        .addStringOption(option =>
            option.setName('symbol')
                .setDescription('Stock symbol (e.g., JOHN42)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantity')
                .setDescription('Number of shares to sell')
                .setRequired(true)
                .setMinValue(1)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const symbol = interaction.options.getString('symbol', true).toUpperCase();
        const quantity = interaction.options.getInteger('quantity', true);
        
        const result = await sellShares(interaction.user.id, symbol, quantity);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const profit = result.profit || 0;
        const profitEmoji = profit >= 0 ? '📈' : '📉';
        const profitText = profit >= 0 ? `+${profit.toLocaleString()}` : profit.toLocaleString();
        
        const marketPrice = result.pricePerShare! * result.quantity!;
        const tradingFee = Math.floor(marketPrice * 0.05);
        
        const embed = new EmbedBuilder()
            .setColor(profit >= 0 ? '#00FF00' : '#FF6B6B')
            .setTitle('💰 Shares Sold!')
            .setDescription(`You sold **${result.quantity} shares** of **${result.stockSymbol}**!`)
            .addFields(
                { name: 'Market Price', value: `${marketPrice.toLocaleString()} coins`, inline: true },
                { name: 'Trading Fee (5%)', value: `-${tradingFee.toLocaleString()} coins`, inline: true },
                { name: 'You Received', value: `${result.totalValue!.toLocaleString()} coins`, inline: true },
                { name: `${profitEmoji} Net Profit/Loss`, value: `${profitText} coins`, inline: false }
            )
            .setFooter({ text: 'Trading fee applies to all stock sales | Check /portfolio for holdings' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const portfolioCommand = {
    data: new SlashCommandBuilder()
        .setName('portfolio')
        .setDescription('View your stock market portfolio'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const portfolio = await getUserPortfolio(interaction.user.id);
        
        if (portfolio.holdings.length === 0) {
            await interaction.editReply('📊 You don\'t own any stock shares yet! Use `/stocks` to view available stocks.');
            return;
        }
        
        const holdingsList = portfolio.holdings.map(holding => {
            const profitLoss = parseInt(holding.profit_loss);
            const profitEmoji = profitLoss >= 0 ? '📈' : '📉';
            const profitText = profitLoss >= 0 ? `+${profitLoss.toLocaleString()}` : profitLoss.toLocaleString();
            
            return `**${holding.stock_symbol}** - ${holding.company_name}\n` +
                   `💼 Shares: ${holding.shares_owned.toLocaleString()} | ` +
                   `💰 Value: ${parseInt(holding.current_value).toLocaleString()} coins\n` +
                   `${profitEmoji} P/L: ${profitText} coins | ` +
                   `🎁 Dividends: ${holding.total_dividends_earned.toLocaleString()} coins`;
        }).join('\n\n');
        
        const totalProfitEmoji = portfolio.totalProfitLoss >= 0 ? '📈' : '📉';
        const totalProfitText = portfolio.totalProfitLoss >= 0 
            ? `+${portfolio.totalProfitLoss.toLocaleString()}` 
            : portfolio.totalProfitLoss.toLocaleString();
        
        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle(`📊 ${interaction.user.username}'s Portfolio`)
            .setDescription(holdingsList)
            .addFields(
                { name: '💵 Total Invested', value: `${portfolio.totalInvested.toLocaleString()} coins`, inline: true },
                { name: '💰 Current Value', value: `${portfolio.totalCurrentValue.toLocaleString()} coins`, inline: true },
                { name: `${totalProfitEmoji} Total P/L`, value: `${totalProfitText} coins`, inline: true },
                { name: '🎁 Total Dividends', value: `${portfolio.totalDividends.toLocaleString()} coins`, inline: true }
            )
            .setFooter({ text: 'Dividends are paid daily!' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const stockInfoCommand = {
    data: new SlashCommandBuilder()
        .setName('stock-info')
        .setDescription('View detailed information about a specific stock')
        .addStringOption(option =>
            option.setName('symbol')
                .setDescription('Stock symbol (e.g., JOHN42)')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const symbol = interaction.options.getString('symbol', true).toUpperCase();
        const stockInfo = await getStockInfo(symbol);
        
        if (!stockInfo) {
            await interaction.editReply(`❌ Stock ${symbol} not found!`);
            return;
        }
        
        const changeEmoji = stockInfo.price_change_24h >= 0 ? '📈' : '📉';
        const changeColor = stockInfo.price_change_24h >= 0 ? '+' : '';
        
        const recentTrades = stockInfo.recentTransactions.length > 0
            ? stockInfo.recentTransactions.map((tx: any) => {
                const type = tx.transaction_type === 'buy' ? '🟢 BUY' : '🔴 SELL';
                return `${type}: ${tx.shares} shares @ ${tx.price_per_share.toLocaleString()} coins`;
            }).join('\n')
            : 'No recent trades';
        
        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle(`📊 ${stockInfo.stock_symbol} - ${stockInfo.company_name}`)
            .setDescription(`Owner: ${stockInfo.owner_name}`)
            .addFields(
                { name: '💰 Current Price', value: `${stockInfo.current_price.toLocaleString()} coins/share`, inline: true },
                { name: `${changeEmoji} 24h Change`, value: `${changeColor}${stockInfo.price_change_24h.toFixed(2)}%`, inline: true },
                { name: '📊 Market Cap', value: `${stockInfo.market_cap.toLocaleString()} coins`, inline: true },
                { name: '📈 Total Shares', value: stockInfo.total_shares.toLocaleString(), inline: true },
                { name: '💵 Available Shares', value: stockInfo.shares_available.toLocaleString(), inline: true },
                { name: '🔥 Shares Sold', value: stockInfo.shares_sold.toLocaleString(), inline: true },
                { name: '⚡ Vault Rate', value: `${stockInfo.coins_per_hour.toFixed(0)} coins/hr`, inline: true },
                { name: '🏦 Vault Level', value: `Level ${stockInfo.vault_level}`, inline: true },
                { name: '🎁 Dividend Rate', value: `${(stockInfo.dividend_rate * 100).toFixed(1)}% daily`, inline: true },
                { name: '📜 Recent Trades', value: recentTrades }
            )
            .setFooter({ text: 'Use /buy-shares to invest in this stock' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};
