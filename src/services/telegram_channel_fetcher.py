# src/services/telegram_get_channels.py

import json
import asyncio
from telethon.sync import TelegramClient
from telethon.tl.types import Channel
from telethon.tl.functions.channels import GetFullChannelRequest
import os
from dotenv import load_dotenv

load_dotenv()

api_id = 23656874
api_hash = "48570c59577532e72a5075021eeecbab"
phone = "+919601281948"

SESSION_FILE = os.path.join(os.path.dirname(__file__), "myner_session")
client = TelegramClient(SESSION_FILE, api_id, api_hash)

async def fetch_channels():
    await client.start(phone=phone)
    dialogs = await client.get_dialogs()

    result = []

    for dialog in dialogs:
        entity = dialog.entity

        if isinstance(entity, Channel):
            try:
                full = await client(GetFullChannelRequest(channel=entity))

                # Safe fallback in case restriction_reason is None
                restriction_list = getattr(entity, 'restriction_reason', []) or []

                channel_info = {
                    "title": entity.title,
                    "username": entity.username,
                    "id": entity.id,
                    "access_hash": entity.access_hash,
                    "megagroup": entity.megagroup,
                    "broadcast": entity.broadcast,
                    "verified": entity.verified,
                    "participants_count": getattr(full.full_chat, "participants_count", 0),
                    "description": getattr(full.full_chat, "about", ""),
                    "creation_date": str(entity.date) if hasattr(entity, "date") else None,
                    "photo": getattr(full.full_chat.chat_photo, "photo_big", None),
                    "pinned_msg_id": getattr(full.full_chat, "pinned_msg_id", None),
                    "linked_chat_id": getattr(full.full_chat, "linked_chat_id", None),
                    "slowmode_seconds": getattr(full.full_chat, "slowmode_seconds", None),
                    "restrictions": [
                        {
                            "platform": r.platform,
                            "reason": r.reason,
                            "text": r.text
                        }
                        for r in restriction_list if r
                    ],
                    "is_scam": getattr(entity, 'scam', False),
                    "is_fake": getattr(entity, 'fake', False),
                    "has_geo": hasattr(entity, 'geo_point') and entity.geo_point is not None
                }

                result.append(channel_info)

            except Exception as e:
                print(f"⚠️ Failed to get full info for {getattr(entity, 'title', 'Unknown')}: {e}")
                continue

    # Print the final result for Node.js or CLI to consume
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    asyncio.run(fetch_channels())
