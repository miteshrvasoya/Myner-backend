import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'Myner',
});

export const initializeDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        product_name TEXT NOT NULL,
        price INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        seller_username TEXT,
        source_channel TEXT,
        message_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ PostgreSQL connected & products table ready.");
  } catch (error) {
    console.error("❌ Error initializing DB:", error);
    throw error;
  }
};

export default pool;
