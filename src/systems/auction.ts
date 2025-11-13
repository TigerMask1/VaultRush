import { pool } from '../database/db';

export async function createAuction(artifactId: number, sellerId: string, startingBid: number, durationMinutes: number) {
    const artifact = await pool.query(`SELECT * FROM artifacts WHERE id = $1 AND owner_id = $2`, [artifactId, sellerId]);
    
    if (artifact.rows.length === 0) {
        return { success: false, message: 'Artifact not found or you do not own it' };
    }
    
    const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    
    const result = await pool.query(
        `INSERT INTO auctions (artifact_id, seller_id, starting_bid, current_bid, ends_at)
         VALUES ($1, $2, $3, $3, $4)
         RETURNING *`,
        [artifactId, sellerId, startingBid, endsAt]
    );
    
    return { success: true, auction: result.rows[0] };
}

export async function placeBid(auctionId: number, bidderId: string, bidAmount: number) {
    const auction = await pool.query(
        `SELECT a.*, ar.name as artifact_name 
         FROM auctions a 
         JOIN artifacts ar ON a.artifact_id = ar.id 
         WHERE a.id = $1 AND a.status = 'active' AND a.ends_at > CURRENT_TIMESTAMP`,
        [auctionId]
    );
    
    if (auction.rows.length === 0) {
        return { success: false, message: 'Auction not found or has ended' };
    }
    
    const auctionData = auction.rows[0];
    
    if (auctionData.seller_id === bidderId) {
        return { success: false, message: 'You cannot bid on your own auction' };
    }
    
    if (bidAmount <= auctionData.current_bid) {
        return { success: false, message: `Bid must be higher than current bid of ${auctionData.current_bid} coins` };
    }
    
    const user = await pool.query(`SELECT coins FROM users WHERE discord_id = $1`, [bidderId]);
    if (user.rows.length === 0 || user.rows[0].coins < bidAmount) {
        return { success: false, message: 'Insufficient coins' };
    }
    
    const previousBidder = auctionData.current_bidder_id;
    const previousBid = auctionData.current_bid;
    
    await pool.query(
        `UPDATE auctions SET current_bid = $1, current_bidder_id = $2 WHERE id = $3`,
        [bidAmount, bidderId, auctionId]
    );
    
    if (previousBidder) {
        await pool.query(
            `UPDATE users SET coins = coins + $1 WHERE discord_id = $2`,
            [previousBid, previousBidder]
        );
    }
    
    await pool.query(
        `UPDATE users SET coins = coins - $1 WHERE discord_id = $2`,
        [bidAmount, bidderId]
    );
    
    return { success: true, message: `Bid placed successfully! Current bid: ${bidAmount} coins` };
}

export async function getActiveAuctions() {
    const result = await pool.query(
        `SELECT a.*, ar.name, ar.rarity, ar.description, u.username as seller_name
         FROM auctions a
         JOIN artifacts ar ON a.artifact_id = ar.id
         JOIN users u ON a.seller_id = u.discord_id
         WHERE a.status = 'active' AND a.ends_at > CURRENT_TIMESTAMP
         ORDER BY a.ends_at ASC`
    );
    
    return result.rows;
}

export async function finalizeExpiredAuctions() {
    const expired = await pool.query(
        `SELECT * FROM auctions WHERE status = 'active' AND ends_at <= CURRENT_TIMESTAMP`
    );
    
    for (const auction of expired.rows) {
        if (auction.current_bidder_id) {
            await pool.query(
                `UPDATE artifacts SET owner_id = $1 WHERE id = $2`,
                [auction.current_bidder_id, auction.artifact_id]
            );
            
            await pool.query(
                `UPDATE users SET coins = coins + $1 WHERE discord_id = $2`,
                [auction.current_bid, auction.seller_id]
            );
            
            await pool.query(
                `INSERT INTO transactions (user_id, transaction_type, amount, description)
                 VALUES ($1, 'auction_sale', $2, 'Artifact sold at auction')`,
                [auction.seller_id, auction.current_bid]
            );
        }
        
        await pool.query(
            `UPDATE auctions SET status = 'completed' WHERE id = $1`,
            [auction.id]
        );
    }
}
