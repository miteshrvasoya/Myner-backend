import { spawn } from 'child_process';
import path from 'path';
import { insertOrUpdateTelegramChannel } from '../models/telegramChannel.model';

export const fetchTelegramMessages = async (
    channelId: number,
    accessHash: number,
    limit: number = 10
): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('.venv/bin/python', [
            'src/services/telegram_fetcher.py',
            channelId.toString(),
            accessHash.toString(),
            limit.toString()
        ]);

        console.log(`🔄 Fetching Telegram messages from channel ${channelId}...`);

        let data = '';
        let errorOutput = '';

        // Accumulate stdout from Python
        pythonProcess.stdout.on('data', (chunk) => {
            console.log(`📥 Received data chunk: ${chunk}`);
            data += chunk.toString();
        });

        // Accumulate stderr (Python errors)
        pythonProcess.stderr.on('data', (error) => {
            console.error(`❌ Python Error: ${error}`);
            errorOutput += error.toString();
        });

        // Handle process completion
        pythonProcess.on('close', (code) => {
            console.log('✅ Telegram fetch script completed.');

            if (errorOutput) {
                console.error("❌ Python reported an error during execution:", errorOutput);
                return reject(errorOutput);
            }

            try {
                
                console.log(`📥 Received ${data.length} messages from Telegram.`);
                console.log(`📂 Check Type of Data: ${typeof data}`);
                const messages = JSON.parse(data);

                if (Array.isArray(messages)) {
                    resolve(messages);
                } else {
                    reject("❌ Python returned unexpected format.");
                }
            } catch (err: any) {
                console.error("❌ Failed to parse Telegram messages:", err.message);
                console.log("📥 Raw data received:", data);
                reject("Failed to parse Telegram messages: " + err.message);
            }
        });
    });
};

export const fetchTelegramChannels = async (): Promise<any[]> => {
    console.log('🔄 Start Fetching Telegram channels...');
    const scriptPath = path.join(__dirname, 'telegram_channel_fetcher.py');
    console.log(`📂 Using script path: ${scriptPath}`);

    return new Promise((resolve, reject) => {
        console.log(`🔄 Starting Telegram channel fetcher script at ${scriptPath}`);
        const python = spawn('.venv/bin/python', [scriptPath]); // Use your venv Python path
        console.log('🔄 Fetching Telegram channels...');

        let data = '';
        let error = '';

        python.stdout.on('data', (chunk) => {
            console.log(`📥 Received channel data chunk: ${chunk}`);
            data += chunk.toString();
            // console.log(`📂 Current data: ${data}`);
        });

        python.stderr.on('data', (chunk) => {
            console.error(`❌ Python Error: ${chunk}`);
            error += chunk.toString();
        });

        python.on('close', (code) => {
            if (code !== 0 || error) {
                console.error('Python Error:', error);
                return reject(new Error('Failed to fetch channels'));
            }

            try {
                const parsed = JSON.parse(data);
                resolve(parsed);
            } catch (e) {
                console.error('❌ JSON Parse Error:', e);
                reject(new Error('Failed to parse channel list'));
            }
        });
    });
};

export const syncTelegramChannels = async () => {
    const channels = await fetchTelegramChannels();
    console.log(`🔄 Syncing ${channels.length} Telegram channels...`);
    for (const channel of channels) {
        await insertOrUpdateTelegramChannel(channel);
    }
    return { message: `${channels.length} channels synced.` };
};