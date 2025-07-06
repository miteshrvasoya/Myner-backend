// File: src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import productRoutes from './routes/product.route';
import telegramRoutes from './routes/telegram.route';
import channelRoutes from './routes/channel.route';
import messageRoutes from './routes/messages.route';
import { initializeDB } from './utils/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/channels', channelRoutes);
app.use("/api/message", messageRoutes);

// Start Server
initializeDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('❌ Failed to start server:', err);
});
