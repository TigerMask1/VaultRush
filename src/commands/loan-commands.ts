import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getOrCreateUser } from '../database/db';
import { createLoan, repayLoan, getUserLoans, cancelLoan } from '../systems/loans';

export const loanCommand = {
    data: new SlashCommandBuilder()
        .setName('loan')
        .setDescription('Create a loan to another player')
        .addUserOption(option =>
            option.setName('borrower')
                .setDescription('The player to lend to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount of coins to lend')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('interest_rate')
                .setDescription('Interest rate (default 0.1 = 10%)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('duration_days')
                .setDescription('Loan duration in days (default 7)')
                .setRequired(false)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const borrower = interaction.options.getUser('borrower', true);
        await getOrCreateUser(borrower.id, borrower.username);
        
        const amount = interaction.options.getInteger('amount', true);
        const interestRate = interaction.options.getNumber('interest_rate') || 0.1;
        const durationDays = interaction.options.getInteger('duration_days') || 7;
        
        const result = await createLoan(interaction.user.id, borrower.id, amount, interestRate, durationDays);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const loan = result.loan;
        const embed = new EmbedBuilder()
            .setColor('#1E90FF')
            .setTitle('💰 Loan Created!')
            .setDescription(`Loan to ${borrower.username} has been created successfully!`)
            .addFields(
                { name: 'Loan Amount', value: `${amount.toLocaleString()} coins`, inline: true },
                { name: 'Interest Rate', value: `${(interestRate * 100).toFixed(0)}%`, inline: true },
                { name: 'Total Owed', value: `${loan.total_owed.toLocaleString()} coins`, inline: true },
                { name: 'Due Date', value: `<t:${Math.floor(new Date(loan.due_date).getTime() / 1000)}:R>`, inline: false },
                { name: 'Loan ID', value: `${loan.id}`, inline: true }
            )
            .setFooter({ text: 'Unpaid loans will auto-deduct from borrower collections' })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const payLoanCommand = {
    data: new SlashCommandBuilder()
        .setName('payloan')
        .setDescription('Repay a loan')
        .addIntegerOption(option =>
            option.setName('loan_id')
                .setDescription('The ID of the loan to repay')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to repay')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const loanId = interaction.options.getInteger('loan_id', true);
        const amount = interaction.options.getInteger('amount', true);
        
        const result = await repayLoan(loanId, interaction.user.id, amount);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Loan Payment Successful!')
            .addFields(
                { name: 'Paid', value: `${result.paid?.toLocaleString() || 0} coins`, inline: true },
                { name: 'Remaining', value: `${result.remaining?.toLocaleString() || 0} coins`, inline: true },
                { name: 'Status', value: result.status === 'completed' ? '✅ Fully Paid' : '⏳ In Progress', inline: true }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const myLoansCommand = {
    data: new SlashCommandBuilder()
        .setName('myloans')
        .setDescription('View your loans (borrowed and lent)'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        await getOrCreateUser(interaction.user.id, interaction.user.username);
        const loans = await getUserLoans(interaction.user.id);
        
        const embed = new EmbedBuilder()
            .setColor('#4169E1')
            .setTitle('💳 Your Loans');
        
        if (loans.borrowed.length > 0) {
            const borrowedList = loans.borrowed.slice(0, 5).map((loan: any) => {
                const remaining = loan.total_owed - loan.amount_paid;
                return `ID ${loan.id} - From **${loan.lender_name}**: ${remaining.toLocaleString()} coins remaining (${loan.status})`;
            }).join('\n');
            embed.addFields({ name: '📥 Loans You Owe', value: borrowedList || 'None' });
        } else {
            embed.addFields({ name: '📥 Loans You Owe', value: 'None' });
        }
        
        if (loans.lent.length > 0) {
            const lentList = loans.lent.slice(0, 5).map((loan: any) => {
                const remaining = loan.total_owed - loan.amount_paid;
                return `ID ${loan.id} - To **${loan.borrower_name}**: ${remaining.toLocaleString()} coins owed (${loan.status})`;
            }).join('\n');
            embed.addFields({ name: '📤 Loans You Made', value: lentList || 'None' });
        } else {
            embed.addFields({ name: '📤 Loans You Made', value: 'None' });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};

export const cancelLoanCommand = {
    data: new SlashCommandBuilder()
        .setName('cancel-loan')
        .setDescription('Cancel a loan (only if no payments made)')
        .addIntegerOption(option =>
            option.setName('loan_id')
                .setDescription('The ID of the loan to cancel')
                .setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const loanId = interaction.options.getInteger('loan_id', true);
        const result = await cancelLoan(loanId, interaction.user.id);
        
        if (!result.success) {
            await interaction.editReply(`❌ ${result.message}`);
            return;
        }
        
        await interaction.editReply('✅ Loan cancelled successfully! Coins have been returned.');
    }
};
