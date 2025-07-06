// src/controllers/channel.controller.ts
import { Request, Response } from 'express';
import { getTelegramChannelList, saveTelegramChannel } from '../services/channel.service';

export const listTelegramChannels = async (_req: Request, res: Response) => {
  try {
    const channels = await getTelegramChannelList();

    return res.json({
      status: 'success',
      message: 'Telegram channels fetched successfully',
      data: channels,
    });
  } catch (err) {
    console.error('❌ Failed to fetch channels:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch Telegram channels',
    });
  }
};

export const saveTelegramChannelController = async (req: Request, res: Response) => {
  try {
    const channelData = req.body.channels;

    console.log('📥 Received channel data:', channelData);

    // Basic validation
    if (!channelData[0].channel_name || !channelData[0].access_hash || !channelData[0].channel_id || !channelData[0].username) {
      console.warn('⚠️ Missing required fields in channel data:');
      // console.warn('Title:', channelData[0].channel_name);
      // console.warn('Access Hash:', channelData[0].access_hash);
      // console.warn('Channel ID:', channelData[0].channel_id);
      // console.warn('Username:', channelData[0].username);

      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: title and access_hash',
      });
    }

    const result = await saveTelegramChannel(channelData);

    console.log('✅ Telegram channel saved successfully:', result);

    res.status(201).json({
      status: 'success',
      message: 'Telegram channel saved successfully',
      data: result,
    });
  } catch (error) {
    console.error('❌ Error saving telegram channel:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save telegram channel',
    });
  }
};