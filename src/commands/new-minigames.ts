import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getOrCreateUser, pool } from '../database/db';
import { 
    playDice, 
    playBlackjack, 
    playSlots, 
    claimDailyReward, 
    playTrivia,
    playRoulette,
    buyLotteryTicket,
    playRPS
} from '../systems/new-minigames';

export const diceCommand = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll dice and bet on the outcome')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Amount to bet')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('prediction')
                .setDescription('Predict the total (2-12)')
                .setRequired(true)
                .setMinValue(2)
                .setMaxValue(12)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const bet = interaction.options.getInteger('bet', true);
        const prediction = interaction.options.getInteger('prediction', true);
        
        const result = await playDice(interaction.user.id, bet, prediction);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor(result.won ? '#00FF00' : '#FF0000')
            .setTitle('🎲 Dice Roll!')
            .setDescription(`Dice 1: **${result.dice1}** | Dice 2: **${result.dice2}** | Total: **${result.total}**\nYou predicted: **${prediction}**`)
            .addFields(
                { name: 'Result', value: result.won ? '✅ Exact Match!' : result.close ? '🟡 Close! (+25% bet)' : '❌ Not Close', inline: true },
                { name: 'Win/Loss', value: `${result.winAmount! >= 0 ? '+' : ''}${result.winAmount!.toLocaleString()} coins`, inline: true },
                { name: 'Balance', value: `${result.newBalance!.toLocaleString()} coins`, inline: true }
            )
            .setFooter({ text: 'Exact match = 10x bet | ±1 = 25% refund' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const blackjackCommand = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play blackjack against the dealer')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Amount to bet')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const bet = interaction.options.getInteger('bet', true);
        
        const result = await playBlackjack(interaction.user.id, bet);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor(result.won ? '#00FF00' : result.push ? '#FFFF00' : '#FF0000')
            .setTitle('🃏 Blackjack!')
            .setDescription(
                `**Your Hand:** ${result.playerHand!.join(', ')} = **${result.playerTotal}**\n` +
                `**Dealer Hand:** ${result.dealerHand!.join(', ')} = **${result.dealerTotal}**`
            )
            .addFields(
                { name: 'Result', value: result.won ? '✅ You Win!' : result.push ? '🤝 Push!' : '❌ Dealer Wins', inline: true },
                { name: 'Win/Loss', value: result.push ? '±0 coins' : `${result.winAmount! >= 0 ? '+' : ''}${result.winAmount!.toLocaleString()} coins`, inline: true },
                { name: 'Balance', value: `${result.newBalance!.toLocaleString()} coins`, inline: true }
            )
            .setFooter({ text: 'Blackjack pays 2:1 | Win pays 1:1' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const slotsCommand = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Spin the slot machine')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Amount to bet')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const bet = interaction.options.getInteger('bet', true);
        
        const result = await playSlots(interaction.user.id, bet);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor(result.won ? '#00FF00' : '#FF0000')
            .setTitle('🎰 Slot Machine!')
            .setDescription(`╔═══════════╗\n║ ${result.reels!.join(' │ ')} ║\n╚═══════════╝`)
            .addFields(
                { name: 'Result', value: result.won ? `✅ ${result.matchType}!` : '❌ No Match', inline: true },
                { name: 'Win/Loss', value: `${result.winAmount! >= 0 ? '+' : ''}${result.winAmount!.toLocaleString()} coins`, inline: true },
                { name: 'Balance', value: `${result.newBalance!.toLocaleString()} coins`, inline: true }
            )
            .setFooter({ text: '💎💎💎 = 50x | 🍒🍒🍒 = 25x | 🔔🔔🔔 = 10x | 2 match = 2x' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const dailyCommand = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward!'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const result = await claimDailyReward(interaction.user.id);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎁 Daily Reward Claimed!')
            .setDescription(`You received **${result.reward!.toLocaleString()} coins**!`)
            .addFields(
                { name: '🔥 Streak', value: `${result.streak} day${result.streak! > 1 ? 's' : ''}`, inline: true },
                { name: '💰 Balance', value: `${result.newBalance!.toLocaleString()} coins`, inline: true },
                { name: '📅 Next Claim', value: `${result.hoursUntilNext} hours`, inline: true }
            )
            .setFooter({ text: 'Come back daily to increase your streak and rewards!' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const triviaCommand = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Answer a trivia question to earn coins'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const result = await playTrivia(interaction.user.id);
        
        const randomOutcome = Math.random();
        const won = randomOutcome < 0.5;
        
        const embed = new EmbedBuilder()
            .setColor(won ? '#00FF00' : '#FF0000')
            .setTitle('🧠 Trivia Challenge!')
            .setDescription(
                `**Question:** ${result.question}\n\n` +
                `${result.options.map((opt: string, i: number) => `${i + 1}. ${opt}`).join('\n')}\n\n` +
                `**Correct Answer:** ${result.options[result.correctAnswer - 1]}`
            )
            .addFields(
                { name: 'Result', value: won ? '✅ You got it right!' : '❌ Better luck next time!', inline: true },
                { name: 'Reward', value: won ? `+${result.reward.toLocaleString()} coins` : '0 coins', inline: true }
            )
            .setFooter({ text: 'Test your knowledge and earn coins!' })
            .setTimestamp();
        
        if (won) {
            await pool.query('UPDATE users SET coins = coins + $1 WHERE discord_id = $2', [result.reward, interaction.user.id]);
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const rouletteCommand = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Bet on the roulette wheel')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Amount to bet')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Bet type')
                .setRequired(true)
                .addChoices(
                    { name: 'Red', value: 'red' },
                    { name: 'Black', value: 'black' },
                    { name: 'Even', value: 'even' },
                    { name: 'Odd', value: 'odd' }
                )),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const bet = interaction.options.getInteger('bet', true);
        const betType = interaction.options.getString('type', true);
        
        const result = await playRoulette(interaction.user.id, bet, betType);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor(result.won ? '#00FF00' : '#FF0000')
            .setTitle('🎡 Roulette!')
            .setDescription(`The wheel landed on: **${result.number}** (${result.color})`)
            .addFields(
                { name: 'Your Bet', value: betType.toUpperCase(), inline: true },
                { name: 'Result', value: result.won ? '✅ Win!' : '❌ Loss', inline: true },
                { name: 'Win/Loss', value: `${result.winAmount! >= 0 ? '+' : ''}${result.winAmount!.toLocaleString()} coins`, inline: true },
                { name: 'Balance', value: `${result.newBalance!.toLocaleString()} coins`, inline: false }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const lotteryCommand = {
    data: new SlashCommandBuilder()
        .setName('lottery')
        .setDescription('Buy a lottery ticket for a chance to win big!'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const result = await buyLotteryTicket(interaction.user.id);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor(result.won ? '#FFD700' : '#4169E1')
            .setTitle('🎟️ Lottery Ticket!');
        
        if (result.won) {
            embed.setDescription(`🎉 **JACKPOT!** You won **${result.winAmount!.toLocaleString()} coins**!`)
                .addFields(
                    { name: 'Your Numbers', value: result.yourNumbers!.join(', '), inline: true },
                    { name: 'Winning Numbers', value: result.winningNumbers!.join(', '), inline: true },
                    { name: 'New Balance', value: `${result.newBalance!.toLocaleString()} coins`, inline: false }
                );
        } else {
            embed.setDescription('Your ticket:')
                .addFields(
                    { name: 'Your Numbers', value: result.yourNumbers!.join(', '), inline: true },
                    { name: 'Winning Numbers', value: result.winningNumbers!.join(', '), inline: true },
                    { name: 'Result', value: '❌ Better luck next time!', inline: false }
                )
                .setFooter({ text: 'Ticket cost: 500 coins | Match all 5 to win 50,000 coins!' });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const rpsCommand = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Play Rock, Paper, Scissors')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('Amount to bet')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Your choice')
                .setRequired(true)
                .addChoices(
                    { name: '✊ Rock', value: 'rock' },
                    { name: '✋ Paper', value: 'paper' },
                    { name: '✌️ Scissors', value: 'scissors' }
                )),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const bet = interaction.options.getInteger('bet', true);
        const choice = interaction.options.getString('choice', true);
        
        const result = await playRPS(interaction.user.id, bet, choice);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const emojis: { [key: string]: string } = { rock: '✊', paper: '✋', scissors: '✌️' };
        
        const embed = new EmbedBuilder()
            .setColor(result.won ? '#00FF00' : result.tie ? '#FFFF00' : '#FF0000')
            .setTitle('✊✋✌️ Rock Paper Scissors!')
            .setDescription(`You: ${emojis[choice]} **${choice.toUpperCase()}**\nBot: ${emojis[result.botChoice!]} **${result.botChoice!.toUpperCase()}**`)
            .addFields(
                { name: 'Result', value: result.won ? '✅ You Win!' : result.tie ? '🤝 Tie!' : '❌ You Lose!', inline: true },
                { name: 'Win/Loss', value: result.tie ? '±0 coins' : `${result.winAmount! >= 0 ? '+' : ''}${result.winAmount!.toLocaleString()} coins`, inline: true },
                { name: 'Balance', value: `${result.newBalance!.toLocaleString()} coins`, inline: true }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};
