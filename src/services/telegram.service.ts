import { spawn } from 'child_process';
import path from 'path';
import { insertOrUpdateTelegramChannel } from '../models/telegramChannel.model';

export const fetchTelegramMessages = async (
    channelId: number,
    accessHash: number,
    limit: number = 10,
    lastSyncTime: string = "",
    username: string = ""
): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        console.log(`🔄 Fetching messages for channelId: ${channelId}, accessHash: ${accessHash}, limit: ${limit}, lastSyncTime: ${lastSyncTime} username: ${username}`);

        const isWindows = process.platform === 'win32';
        const pythonPath = isWindows ? "python" : ".venv/bin/python"; // use 'python' on Windows

        const scriptPath = path.join(__dirname, "telegram_fetcher.py");
        console.log(`📂 Using script path: ${scriptPath}`);
        console.log(`🐍 Using Python path: ${pythonPath}`);

        const args = [scriptPath, channelId.toString(), accessHash.toString(), limit.toString(), lastSyncTime, username];
        if (lastSyncTime) args.push(lastSyncTime);
        if (username) args.push(username);

        const pythonProcess = spawn(pythonPath, args);

        let data = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (chunk) => {
            data += chunk.toString();
        });

        pythonProcess.stderr.on("data", (err) => {
            errorOutput += err.toString();
        });

        pythonProcess.on("close", () => {
            if (errorOutput) return reject(new Error(errorOutput));
            try {
                console.log(`📥 Received data: ${data}`);
                const messages = JSON.parse(data);
                if (Array.isArray(messages)) return resolve(messages);
                reject(new Error("Unexpected response format"));
            } catch (err: any) {
                reject(new Error("JSON parse error: " + err.message));
            }
        });
    });
};

export const fetchTelegramChannels = async (): Promise<any[]> => {
    console.log('🔄 Start Fetching Telegram channels...');

    const isWindows = process.platform === 'win32';
    const pythonPath = isWindows ? ".venv\\Scripts\\python.exe" : ".venv/bin/python";

    console.log(`🔄 Using Python path: ${pythonPath}`);

    const scriptPath = path.join(__dirname, 'telegram_channel_fetcher.py');
    console.log(`📂 Using script path: ${scriptPath}`);

    return new Promise((resolve, reject) => {
        console.log(`🔄 Starting Telegram channel fetcher script at ${scriptPath}`);
        const python = spawn("python", [scriptPath]); // Use your venv Python path
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