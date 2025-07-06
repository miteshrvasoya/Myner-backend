// src/models/telegramChannel.model.ts
import pool from '../utils/db';

export const insertOrUpdateTelegramChannel = async (channel: {
    id: number;
    title: string;
    username: string | null;
    access_hash: number;
}) => {
    const query = `
    INSERT INTO telegram_channels (channel_id, title, username, access_hash)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (channel_id) DO UPDATE
    SET title = EXCLUDED.title,
        username = EXCLUDED.username,
        access_hash = EXCLUDED.access_hash,
        updated_at = NOW();
  `;
    const values = [channel.id, channel.title, channel.username, channel.access_hash];
    await pool.query(query, values);
};
