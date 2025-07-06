// src/routes/channel.routes.ts
import express from 'express';
import { listSavedTelegramChannels, listTelegramChannels, saveTelegramChannelController } from '../controllers/channel.controller';
import { syncChannelMessages } from '../controllers/message.controller';

const router = express.Router();

router.get('/list', listTelegramChannels);
router.get("/saved/list", listSavedTelegramChannels);
router.post('/save', saveTelegramChannelController);
router.get("/:id/messages/sync", syncChannelMessages);

export default router;
