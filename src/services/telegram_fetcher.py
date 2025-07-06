# src/services/telegram_fetcher.py
import sys
import json
import asyncio
import os
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.errors.rpcerrorlist import ChannelInvalidError
from telethon.tl.types import InputPeerChannel

load_dotenv()

# api_id = int(os.getenv("TELEGRAM_API_ID"))
# api_hash = os.getenv("TELEGRAM_API_KEY")
# phone = os.getenv("TELEGRAM_PHONE_NUMBER")
api_id = 23656874
api_hash = "48570c59577532e72a5075021eeecbab"
phone = "+919601281948"

SESSION_FILE = os.path.join(os.path.dirname(__file__), "myner_session")
client = TelegramClient(SESSION_FILE, api_id, api_hash)

channel_id = 1682721934
access_hash = -3281610255801187991

async def fetch(channel_id, access_hash, limit=10):
    try:
        await client.start(phone=phone)

        # Safely create entity
        try:
            entity = InputPeerChannel(channel_id=int(channel_id), access_hash=int(access_hash))
        except Exception as e:
            print(json.dumps({"error": f"Invalid channel entity: {str(e)}"}))
            return

        messages = []
        async for msg in client.iter_messages(entity, limit=limit):
            if msg.message:
                messages.append({
                    "text": msg.message,
                    "date": str(msg.date),
                    "sender_id": msg.sender_id
                })

        print(json.dumps(messages))  # ✔️ Output to Node (stdout only)
    
    except ChannelInvalidError as ce:
        print(json.dumps({"error": "ChannelInvalidError: You might not be a member of this channel or access_hash is wrong."}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    # if len(sys.argv) < 3:
    #     print(json.dumps({"error": "Missing required arguments: channel_id and access_hash"}))
    #     sys.exit(1)

    # channel_id = sys.argv[1]
    # access_hash = sys.argv[2]
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10

    asyncio.run(fetch(channel_id, access_hash, limit))
