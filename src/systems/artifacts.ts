import { pool } from '../database/db';

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

interface ArtifactTemplate {
    name: string;
    rarity: Rarity;
    bonusType: 'coin_rate' | 'speed' | 'luck';
    bonusValue: number;
    description: string;
}

const ARTIFACT_TEMPLATES: ArtifactTemplate[] = [
    { name: 'Golden Gear', rarity: 'Common', bonusType: 'coin_rate', bonusValue: 0.05, description: '+5% coin generation' },
    { name: 'Silver Cog', rarity: 'Common', bonusType: 'speed', bonusValue: 0.03, description: '+3% vault speed' },
    { name: 'Lucky Coin', rarity: 'Common', bonusType: 'luck', bonusValue: 0.02, description: '+2% luck bonus' },
    { name: 'Ruby Engine', rarity: 'Rare', bonusType: 'coin_rate', bonusValue: 0.15, description: '+15% coin generation' },
    { name: 'Sapphire Wheel', rarity: 'Rare', bonusType: 'speed', bonusValue: 0.10, description: '+10% vault speed' },
    { name: 'Diamond Vault Core', rarity: 'Epic', bonusType: 'coin_rate', bonusValue: 0.30, description: '+30% coin generation' },
    { name: 'Platinum Accelerator', rarity: 'Epic', bonusType: 'speed', bonusValue: 0.25, description: '+25% vault speed' },
    { name: 'Mythical Vault Crown', rarity: 'Legendary', bonusType: 'coin_rate', bonusValue: 0.50, description: '+50% coin generation' },
    { name: 'Eternal Fortune Charm', rarity: 'Legendary', bonusType: 'luck', bonusValue: 0.40, description: '+40% luck bonus' }
];

export async function generateRandomArtifact(userId: string, source: string = 'event'): Promise<any> {
    const rarityRoll = Math.random();
    let targetRarity: Rarity;
    
    if (rarityRoll < 0.50) targetRarity = 'Common';
    else if (rarityRoll < 0.80) targetRarity = 'Rare';
    else if (rarityRoll < 0.95) targetRarity = 'Epic';
    else targetRarity = 'Legendary';
    
    const possibleArtifacts = ARTIFACT_TEMPLATES.filter(a => a.rarity === targetRarity);
    const template = possibleArtifacts[Math.floor(Math.random() * possibleArtifacts.length)];
    
    const result = await pool.query(
        `INSERT INTO artifacts (owner_id, name, rarity, bonus_type, bonus_value, description, acquired_from)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, template.name, template.rarity, template.bonusType, template.bonusValue, template.description, source]
    );
    
    return result.rows[0];
}

export async function getUserArtifacts(userId: string) {
    const result = await pool.query(
        `SELECT * FROM artifacts WHERE owner_id = $1 ORDER BY 
         CASE rarity 
            WHEN 'Legendary' THEN 1
            WHEN 'Epic' THEN 2
            WHEN 'Rare' THEN 3
            WHEN 'Common' THEN 4
         END, created_at DESC`,
        [userId]
    );
    
    return result.rows;
}

export async function getArtifactById(artifactId: number) {
    const result = await pool.query(`SELECT * FROM artifacts WHERE id = $1`, [artifactId]);
    return result.rows[0] || null;
}

export function getRarityEmoji(rarity: Rarity): string {
    const emojis = {
        'Common': '⚪',
        'Rare': '🔵',
        'Epic': '🟣',
        'Legendary': '🟡'
    };
    return emojis[rarity];
}
