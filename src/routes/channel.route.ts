// src/routes/channel.routes.ts
import express from 'express';
import { listSavedTelegramChannels, listTelegramChannels, saveTelegramChannelController } from '../controllers/channel.controller';

const router = express.Router();

router.get('/list', listTelegramChannels);
router.get("/saved/list", listSavedTelegramChannels);
router.post('/save', saveTelegramChannelController);

export default router;
