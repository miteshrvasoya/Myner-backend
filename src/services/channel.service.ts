// src/services/channel.service.ts

import { insertManyRecords, insertRecord, listRecords } from "../utils/dbUtils";
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

//Fetch Save Channels list
export const getChannelManagerList = async () => {
  const query = `
    SELECT 
      ch.id,
      ch.title AS name,
      ch.username,
      ch.category,
      ch.tag,
      ch.channel_type AS type,
      ch.sync_frequency,
      ch.created_at,
      ch.is_active,
      ch.channel_id,
      ch.access_hash,
      COUNT(p.id) AS products_found,
      ROUND(AVG(p.price))::int AS avg_price,
      MAX(p.created_at) AS last_activity,
      (
        SELECT product_name 
        FROM products 
        WHERE source_channel_id = ch.id 
        ORDER BY price DESC 
        LIMIT 1
      ) AS top_product
    FROM telegram_channels ch
    LEFT JOIN products p ON p.source_channel_id = ch.id
    GROUP BY ch.id
    ORDER BY last_activity DESC NULLS LAST;
  `;

  const rows = await listRecords(query);

  // Helper to format time-ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
    return `${Math.floor(diff / 31536000)} years ago`;
  };

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    platform: "telegram",
    type: row.type || "public",
    members: 0, // optional if not stored
    category: row.category || "",
    status: row.is_active ? "active" : "inactive",
    lastActivity: row.last_activity ? formatTimeAgo(new Date(row.last_activity)) : "—",
    productsFound: Number(row.products_found),
    avgPrice: row.avg_price ? `₹${row.avg_price.toLocaleString()}` : "₹0",
    topProduct: row.top_product || "-",
    joinDate: formatTimeAgo(new Date(row.created_at)),
    inviteLink: row.username ? `https://t.me/${row.username}` : "",
    tag: row.tag || "",
    syncFrequency: row.sync_frequency || "5min",
  }));
};