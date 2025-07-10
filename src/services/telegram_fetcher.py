# src/services/telegram_fetcher.py
import sys
import json
import asyncio
import os
from datetime import datetime
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.errors.rpcerrorlist import ChannelInvalidError, UsernameNotOccupiedError
from telethon.tl.types import InputPeerChannel

load_dotenv()

# Telegram credentials (use your own or from .env)
api_id = int(os.getenv("TELEGRAM_API_ID", 28547257))
api_hash = os.getenv("TELEGRAM_API_HASH", "9b63345f165ef7836cf019e8e9210c3f")
phone = os.getenv("TELEGRAM_PHONE", "+919624090688")

# Session file path
SESSION_FILE = os.path.join(os.path.dirname(__file__), "myner_session")
client = TelegramClient(SESSION_FILE, api_id, api_hash)

async def fetch(channel_id, access_hash, limit = 300, last_sync_time=None, username=None):
    try:
        await client.start(phone=phone)

        # Resolve entity via username (preferred fallback) or ID + access_hash
        try:
            if username:
                entity = await client.get_entity(username)
            else:
                entity = await client.get_entity(InputPeerChannel(channel_id=int(channel_id), access_hash=int(access_hash)))
        except UsernameNotOccupiedError:
            print(json.dumps({"error": "Username not found or occupied."}))
            return
        except Exception as e:
            print(json.dumps({"error": f"Failed to resolve entity: {str(e)}"}))
            return

        messages = []

        async for msg in client.iter_messages(entity, limit=limit):
            if msg.message:
                # Filter by last sync time
                if last_sync_time:
                    try:
                        sync_time = datetime.fromisoformat(last_sync_time)
                        if msg.date <= sync_time:
                            break
                    except Exception as e:
                        print(json.dumps({"error": f"Invalid last_sync_time format: {str(e)}"}))
                        return

                messages.append({
                    "text": msg.message,
                    "date": str(msg.date),
                    "sender_id": msg.sender_id,
                    "message_id": msg.id
                })

        print(json.dumps(messages))  # Send to Node.js
    except ChannelInvalidError:
        print(json.dumps({"error": "ChannelInvalidError: Not a member or invalid access_hash"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    # if len(sys.argv) < 3:
    #     print(json.dumps({"error": "Missing required arguments: channel_id, access_hash"}))
    #     sys.exit(1)

    channel_id = int(sys.argv[1])
    access_hash = int(sys.argv[2])
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    last_sync_time = sys.argv[4] if len(sys.argv) > 4 else None
    username = sys.argv[5] if len(sys.argv) > 5 else None

    # print(f"🔄 Fetching messages for channel_id: {channel_id}, access_hash: {access_hash}, limit: {limit}, last_sync_time: {last_sync_time}, username: {username}")

    asyncio.run(fetch(channel_id, access_hash, limit, last_sync_time, username))
