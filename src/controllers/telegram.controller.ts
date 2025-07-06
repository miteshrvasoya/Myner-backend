// src/controllers/telegram.controller.ts
import { Request, Response } from 'express';
import { syncTelegramChannels as syncChannelsService } from '../services/telegram.service';

export const syncTelegramChannels = async (req: Request, res: Response) => {
  try {
    const result = await syncChannelsService();
    res.json(result);
  } catch (err) {
    console.error('❌ Error syncing channels:', err);
    res.status(500).json({ error: 'Failed to sync channels' });
  }
};
