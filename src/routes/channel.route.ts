// src/routes/channel.routes.ts
import express from 'express';
import { listTelegramChannels, saveTelegramChannelController } from '../controllers/channel.controller';

const router = express.Router();

router.get('/list', listTelegramChannels);
router.post('/save', saveTelegramChannelController);

export default router;
