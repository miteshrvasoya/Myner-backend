// src/controllers/messageController.ts
import { Request, Response } from "express";
import { fetchTelegramMessages } from "../services/telegram.service";
import { insertRecord, selectRecord, updateRecord } from "../utils/dbUtils";
import { parseWithGemini } from "../services/gemini.service";
import { parseWithLocalLLM } from "../services/parser.service";

// export const syncChannelMessages = async (req: Request, res: Response) => {
//   const channelDbId = parseInt(req.params.id);
//   const limit = parseInt(req.query.limit as string) || 20;

//   try {
//     const channel = await selectRecord(
//       `SELECT id, channel_id, access_hash, last_sync_time, username FROM telegram_channels WHERE id = $1`,
//       [channelDbId]
//     );

//     if (!channel) {
//       return res.status(404).json({
//         status: "error",
//         message: "Channel not found",
//       });
//     }
//     // Convert last_sync_time to ISO format if it exists
//     let lastSyncTimeISO: string | undefined = undefined;
//     if (channel.last_sync_time) {
//       const date = new Date(channel.last_sync_time);
//       if (!isNaN(date.getTime())) {
//         lastSyncTimeISO = date.toISOString();
//       }
//     }

//     channel.last_sync_time = lastSyncTimeISO;
    
//     console.log(`🔄 Syncing messages for channel ID ${channel.channel_id} with limit ${limit} Last Sync Time: ${channel.last_sync_time}`);

//     const messages = await fetchTelegramMessages(
//       channel.channel_id,
//       channel.access_hash,
//       limit,
//       channel.last_sync_time
//     );

//     console.log(`📥 Fetched ${messages.length} messages for channel ID ${channel.channel_id}`);
//     console.log(`Last sync time: ${channel.last_sync_time}`);
//     console.log(`Messages:`, messages.slice(0, 5)); // Log first 5 messages for brevity

//     res.json({
//       status: "success",
//       message: `Fetched ${messages.length} new messages`,
//       data: messages,
//     });
//   } catch (err) {
//     console.error("❌ Sync error:", err);
//     res.status(500).json({
//       status: "error",
//       message: "Failed to sync messages",
//     });
//   }
// };

export const syncChannelMessages = async (req: Request, res: Response) => {
  const channelDbId = parseInt(req.params.id);
  const limit = 300;

  try {
    const channel = await selectRecord(
      `SELECT id, channel_id, access_hash, last_sync_time, username FROM telegram_channels WHERE id = $1`,
      [channelDbId]
    );

    if (!channel) {
      return res.status(404).json({ status: "error", message: "Channel not found" });
    }

    let lastSyncTimeISO: string | undefined = undefined;
    if (channel.last_sync_time) {
      const date = new Date(channel.last_sync_time);
      if (!isNaN(date.getTime())) {
        lastSyncTimeISO = date.toISOString();
      }
    }

    const messages = await fetchTelegramMessages(
      channel.channel_id,
      channel.access_hash,
      limit,
      lastSyncTimeISO,
      channel.username
    );

    console.log(`📥 Fetched ${messages.length} messages for channel ${channel.channel_id}`);

    let successCount = 0;
    for (const msg of messages) {
      const parsed = await parseWithLocalLLM(msg.text);
      if (!parsed) continue;

      // Save seller if not exists
      const existingSeller = await selectRecord(
        `SELECT id FROM sellers WHERE telegram_id = $1`,
        [msg.sender_id]
      );

      let sellerId = existingSeller?.id;
      if (!sellerId) {
        const seller = await insertRecord("sellers", {
          telegram_id: msg.sender_id,
        }, "telegram_id", []);

        sellerId = seller?.id;
      }

      // Save message
      const savedMsg = await insertRecord("messages", {
        message_id: msg.message_id,
        telegram_channel_id: channel.channel_id,
        sender_telegram_id: msg.sender_id,
        message_text: msg.text,
        posted_at: new Date(msg.date),
      }, "message_id", ["message_text", "posted_at"]);

      console.log(`📥 Saved message ID ${savedMsg.id} for channel ${channel.channel_id}`);

      // Save product
      await insertRecord("products", {
        message_id: savedMsg.id,
        product_name: parsed.product_name,
        price: parsed.price,
        quantity: parsed.quantity,
        seller_id: sellerId,
        source_channel_id: channelDbId,
      });

      successCount++;
    }

      // Update last_sync_time
      await updateRecord(
          "telegram_channels",
          {
              last_sync_time: new Date().toISOString(), // correct
          },
          "id = $1",
          [channelDbId] // correct value
      );

    res.json({
      status: "success",
      message: `Synced ${successCount} product messages from channel`,
      data: { synced: successCount, total_fetched: messages.length }
    });
  } catch (err) {
    console.error("❌ Sync error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to sync messages",
    });
  }
};