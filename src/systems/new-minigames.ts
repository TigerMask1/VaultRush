import { pool } from '../database/db';

export async function playDice(userId: string, bet: number, prediction: number) {
    if (bet < 10) {
        return { success: false, message: 'Minimum bet is 10 coins!' };
    }
    
    const user = await pool.query('SELECT coins FROM users WHERE discord_id = $1', [userId]);
    
    if (user.rows[0].coins < bet) {
        return { success: false, message: 'Insufficient coins!' };
    }
    
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    
    let winAmount = -bet;
    let won = false;
    let close = false;
    
    if (total === prediction) {
        winAmount = bet * 10;
        won = true;
    } else if (Math.abs(total - prediction) === 1) {
        winAmount = Math.floor(bet * 0.25);
        close = true;
    }
    
    await pool.query('UPDATE users SET coins = coins + $1 WHERE discord_id = $2', [winAmount, userId]);
    
    const newBalance = user.rows[0].coins + winAmount;
    
    return {
        success: true,
        dice1,
        dice2,
        total,
        won,
        close,
        winAmount,
        newBalance
    };
}

export async function playBlackjack(userId: string, bet: number) {
    if (bet < 10) {
        return { success: false, message: 'Minimum bet is 10 coins!' };
    }
    
    const user = await pool.query('SELECT coins FROM users WHERE discord_id = $1', [userId]);
    
    if (user.rows[0].coins < bet) {
        return { success: false, message: 'Insufficient coins!' };
    }
    
    const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const getCardValue = (card: string, currentTotal: number) => {
        if (card === 'A') return currentTotal + 11 > 21 ? 1 : 11;
        if (['J', 'Q', 'K'].includes(card)) return 10;
        return parseInt(card);
    };
    
    const drawCard = () => cards[Math.floor(Math.random() * cards.length)];
    
    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];
    
    let playerTotal = getCardValue(playerHand[0], 0) + getCardValue(playerHand[1], getCardValue(playerHand[0], 0));
    let dealerTotal = getCardValue(dealerHand[0], 0) + getCardValue(dealerHand[1], getCardValue(dealerHand[0], 0));
    
    while (playerTotal < 17) {
        const newCard = drawCard();
        playerHand.push(newCard);
        playerTotal += getCardValue(newCard, playerTotal);
    }
    
    while (dealerTotal < 17) {
        const newCard = drawCard();
        dealerHand.push(newCard);
        dealerTotal += getCardValue(newCard, dealerTotal);
    }
    
    let winAmount = -bet;
    let won = false;
    let push = false;
    
    if (playerTotal > 21) {
        won = false;
    } else if (dealerTotal > 21) {
        won = true;
        winAmount = bet * 2;
    } else if (playerTotal === dealerTotal) {
        push = true;
        winAmount = 0;
    } else if (playerTotal > dealerTotal) {
        won = true;
        winAmount = playerTotal === 21 && playerHand.length === 2 ? bet * 3 : bet * 2;
    }
    
    await pool.query('UPDATE users SET coins = coins + $1 WHERE discord_id = $2', [winAmount, userId]);
    
    const newBalance = user.rows[0].coins + winAmount;
    
    return {
        success: true,
        playerHand,
        dealerHand,
        playerTotal,
        dealerTotal,
        won,
        push,
        winAmount,
        newBalance
    };
}

export async function playSlots(userId: string, bet: number) {
    if (bet < 10) {
        return { success: false, message: 'Minimum bet is 10 coins!' };
    }
    
    const user = await pool.query('SELECT coins FROM users WHERE discord_id = $1', [userId]);
    
    if (user.rows[0].coins < bet) {
        return { success: false, message: 'Insufficient coins!' };
    }
    
    const symbols = ['🍒', '🍋', '🔔', '⭐', '💎'];
    const reels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
    ];
    
    let winAmount = -bet;
    let won = false;
    let matchType = '';
    
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
        won = true;
        if (reels[0] === '💎') {
            winAmount = bet * 50;
            matchType = 'Diamond Jackpot';
        } else if (reels[0] === '🍒') {
            winAmount = bet * 25;
            matchType = 'Cherry Triple';
        } else if (reels[0] === '🔔') {
            winAmount = bet * 10;
            matchType = 'Bell Triple';
        } else {
            winAmount = bet * 5;
            matchType = 'Triple Match';
        }
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
        won = true;
        winAmount = bet * 2;
        matchType = 'Double Match';
    }
    
    await pool.query('UPDATE users SET coins = coins + $1 WHERE discord_id = $2', [winAmount, userId]);
    
    const newBalance = user.rows[0].coins + winAmount;
    
    return {
        success: true,
        reels,
        won,
        matchType,
        winAmount,
        newBalance
    };
}

export async function claimDailyReward(userId: string) {
    const lastClaim = await pool.query(
        `SELECT 
            COALESCE(
                (SELECT created_at FROM transactions 
                 WHERE user_id = $1 AND transaction_type = 'daily_reward' 
                 ORDER BY created_at DESC LIMIT 1),
                TIMESTAMP '2000-01-01'
            ) as last_claim`,
        [userId]
    );
    
    const now = new Date();
    const lastClaimTime = new Date(lastClaim.rows[0].last_claim);
    const hoursSinceLastClaim = (now.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastClaim < 20) {
        const hoursLeft = Math.ceil(20 - hoursSinceLastClaim);
        return { success: false, message: `You already claimed your daily reward! Come back in ${hoursLeft} hours.` };
    }
    
    const streakCheck = await pool.query(
        `SELECT COUNT(*) as streak FROM transactions 
         WHERE user_id = $1 AND transaction_type = 'daily_reward' 
         AND created_at > NOW() - INTERVAL '30 days'`,
        [userId]
    );
    
    const streak = (streakCheck.rows[0]?.streak || 0) + 1;
    const baseReward = 500;
    const streakBonus = Math.min(streak * 100, 1000);
    const totalReward = baseReward + streakBonus;
    
    await pool.query('UPDATE users SET coins = coins + $1 WHERE discord_id = $2', [totalReward, userId]);
    await pool.query(
        `INSERT INTO transactions (user_id, transaction_type, amount, description) 
         VALUES ($1, 'daily_reward', $2, $3)`,
        [userId, totalReward, `Daily reward - Day ${streak}`]
    );
    
    const user = await pool.query('SELECT coins FROM users WHERE discord_id = $1', [userId]);
    
    return {
        success: true,
        reward: totalReward,
        streak,
        newBalance: user.rows[0].coins,
        hoursUntilNext: 20
    };
}

export async function playTrivia(userId: string) {
    const questions = [
        {
            question: 'What is the capital of France?',
            options: ['London', 'Paris', 'Berlin', 'Madrid'],
            correct: 2
        },
        {
            question: 'How many planets are in our solar system?',
            options: ['7', '8', '9', '10'],
            correct: 2
        },
        {
            question: 'What is the largest ocean on Earth?',
            options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
            correct: 4
        },
        {
            question: 'Who painted the Mona Lisa?',
            options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Michelangelo'],
            correct: 2
        },
        {
            question: 'What year did World War II end?',
            options: ['1943', '1944', '1945', '1946'],
            correct: 3
        },
        {
            question: 'What is the smallest prime number?',
            options: ['0', '1', '2', '3'],
            correct: 3
        },
        {
            question: 'How many continents are there?',
            options: ['5', '6', '7', '8'],
            correct: 3
        },
        {
            question: 'What is the chemical symbol for gold?',
            options: ['Go', 'Gd', 'Au', 'Ag'],
            correct: 3
        }
    ];
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    const reward = 200 + Math.floor(Math.random() * 300);
    
    return {
        success: true,
        question: randomQuestion.question,
        options: randomQuestion.options,
        correctAnswer: randomQuestion.correct,
        reward
    };
}

export async function playRoulette(userId: string, bet: number, betType: string) {
    if (bet < 10) {
        return { success: false, message: 'Minimum bet is 10 coins!' };
    }
    
    const user = await pool.query('SELECT coins FROM users WHERE discord_id = $1', [userId]);
    
    if (user.rows[0].coins < bet) {
        return { success: false, message: 'Insufficient coins!' };
    }
    
    const number = Math.floor(Math.random() * 37);
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const color = number === 0 ? 'green' : redNumbers.includes(number) ? 'red' : 'black';
    
    let won = false;
    
    if (betType === 'red' && color === 'red') won = true;
    if (betType === 'black' && color === 'black') won = true;
    if (betType === 'even' && number !== 0 && number % 2 === 0) won = true;
    if (betType === 'odd' && number % 2 === 1) won = true;
    
    const winAmount = won ? bet * 2 : -bet;
    
    await pool.query('UPDATE users SET coins = coins + $1 WHERE discord_id = $2', [winAmount, userId]);
    
    const newBalance = user.rows[0].coins + winAmount;
    
    return {
        success: true,
        number,
        color,
        won,
        winAmount,
        newBalance
    };
}

export async function buyLotteryTicket(userId: string) {
    const ticketCost = 500;
    
    const user = await pool.query('SELECT coins FROM users WHERE discord_id = $1', [userId]);
    
    if (user.rows[0].coins < ticketCost) {
        return { success: false, message: 'Insufficient coins! Lottery ticket costs 500 coins.' };
    }
    
    const generateNumbers = (): number[] => {
        const numbers: number[] = [];
        while (numbers.length < 5) {
            const num = Math.floor(Math.random() * 50) + 1;
            if (!numbers.includes(num)) numbers.push(num);
        }
        return numbers.sort((a, b) => a - b);
    };
    
    const yourNumbers = generateNumbers();
    const winningNumbers = generateNumbers();
    
    const matches = yourNumbers.filter(num => winningNumbers.includes(num)).length;
    
    let winAmount = -ticketCost;
    let won = false;
    
    if (matches === 5) {
        winAmount = 50000 - ticketCost;
        won = true;
    } else if (matches === 4) {
        winAmount = 5000 - ticketCost;
        won = true;
    } else if (matches === 3) {
        winAmount = 500 - ticketCost;
        won = true;
    }
    
    await pool.query('UPDATE users SET coins = coins + $1 WHERE discord_id = $2', [winAmount, userId]);
    
    const newBalance = user.rows[0].coins + winAmount;
    
    return {
        success: true,
        yourNumbers,
        winningNumbers,
        matches,
        won,
        winAmount: won ? winAmount + ticketCost : 0,
        newBalance
    };
}

export async function playRPS(userId: string, bet: number, choice: string) {
    if (bet < 10) {
        return { success: false, message: 'Minimum bet is 10 coins!' };
    }
    
    const user = await pool.query('SELECT coins FROM users WHERE discord_id = $1', [userId]);
    
    if (user.rows[0].coins < bet) {
        return { success: false, message: 'Insufficient coins!' };
    }
    
    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    
    let won = false;
    let tie = false;
    
    if (choice === botChoice) {
        tie = true;
    } else if (
        (choice === 'rock' && botChoice === 'scissors') ||
        (choice === 'paper' && botChoice === 'rock') ||
        (choice === 'scissors' && botChoice === 'paper')
    ) {
        won = true;
    }
    
    const winAmount = tie ? 0 : won ? bet * 2 : -bet;
    
    await pool.query('UPDATE users SET coins = coins + $1 WHERE discord_id = $2', [winAmount, userId]);
    
    const newBalance = user.rows[0].coins + winAmount;
    
    return {
        success: true,
        botChoice,
        won,
        tie,
        winAmount,
        newBalance
    };
}
