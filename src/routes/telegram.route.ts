// src/routes/telegram.routes.ts
import express from 'express';
import { fetchTelegramChannels } from '../services/telegram.service';
import { syncTelegramChannels } from '../controllers/telegram.controller';

const router = express.Router();

router.get('/channels', async (req, res) => {
  try {
    const channels = await fetchTelegramChannels();
    res.json({ success: true, channels });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch channels' });
  }
});

router.get('/sync-channels', syncTelegramChannels);

export default router;
