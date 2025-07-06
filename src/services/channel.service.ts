// src/services/channel.service.ts

import { insertManyRecords, insertRecord } from "../utils/dbUtils";
import { fetchTelegramChannels } from "./telegram.service";

export const getTelegramChannelList = async (): Promise<any[]> => {
  const rawChannels = await fetchTelegramChannels();

  console.log("📥 Raw channels data:", rawChannels);

  // Transform raw data into expected response format
  const transformed = rawChannels.map((channel: any) => ({
    channel_id: channel.id?.toString() || null, // Ensure channel_id is a string
    username: channel.username || null,
    access_hash: channel.access_hash || null, // Use access_hash if available
    channel_name: channel.title,
    telegram_id: channel.id?.toString(),
    members: channel.participants_count || Math.floor(Math.random() * 5000) + 100, // Fake data if unavailable
    is_verified: false, // Assume false by default, can update later
    joined_at: new Date().toISOString(), // Placeholder
    owner_username: "NA", // Placeholder
    tags: ["general"], // Placeholder
    description: channel.title || "No description provided.",
    is_saved: false,
  }));

  return transformed;
};

export const saveTelegramChannel = async (channelDataArray: any[]) => {
  if (!Array.isArray(channelDataArray) || channelDataArray.length === 0) {
    throw new Error("Invalid channel data");
  }

  const columns = [
    "title",
    "username",
    "channel_id",
    "access_hash",
    "is_active",
    "created_at",
    "updated_at",
  ];

  const values: any[][] = channelDataArray.map((channel) => [
    channel.channel_name,
    channel.username || null,
    channel.channel_id,
    channel.access_hash,
    channel.is_active ?? true,
    new Date().toISOString(),
    new Date().toISOString(),
  ]);

  const conflictKey = "channel_id";
  const updateFields = ["title", "username", "access_hash", "is_active", "updated_at"];

  let result: any = await insertManyRecords("telegram_channels", columns, values, conflictKey, updateFields);

  console.log("✅ Channels saved successfully:", result);

  return { status: "success", message: `${values.length} channels saved.` };
};