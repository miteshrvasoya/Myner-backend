import { Request, Response } from 'express';
import { Product } from '../models/product.model';
import pool from '../utils/db';

export const createProduct = async (req: Request, res: Response) => {
  const { product_name, price, quantity, seller_username, source_channel, message_text } = req.body as Product;

  try {
    const result = await pool.query(
      `INSERT INTO products (product_name, price, quantity, seller_username, source_channel, message_text)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [product_name, price, quantity, seller_username, source_channel, message_text]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Failed to insert product:", error);
    res.status(500).json({ message: 'Error saving product.' });
  }
};

// export const searchProducts = async (req: Request, res: Response) => {
//   const query = req.query.query as string;

//   try {
//     const result = await pool.query(
//       `SELECT * FROM products
//        WHERE product_name ILIKE $1
//           OR message_text ILIKE $1
//           OR source_channel ILIKE $1
//           OR seller_username ILIKE $1
//        ORDER BY price ASC`,
//       [`%${query}%`]
//     );

//     res.json(result.rows);
//   } catch (error) {
//     console.error("❌ Search failed:", error);
//     res.status(500).json({ message: 'Error searching products.' });
//   }
// };

import { fetchTelegramMessages } from '../services/telegram.service';
import { parseWithGemini } from '../services/gemini.service';
import { searchProducts } from '../services/product.service';
import { formatErrorResponse, formatSuccessResponse } from '../utils/responseFormatter';

export const importTelegramProducts = async (req: Request, res: Response) => {
  const { channelId, accessHash, limit } = req.body;

  try {
    const messages = await fetchTelegramMessages(channelId, accessHash, limit);
    const products = [];

    for (const msg of messages) {
      const parsed = await parseWithGemini(msg.text);
      if (parsed && parsed.product_name) {
        const result = await pool.query(
          `INSERT INTO products (product_name, price, quantity, seller_username, source_channel, message_text)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            parsed.product_name,
            parsed.price,
            parsed.quantity,
            msg.sender_id?.toString() || 'unknown',
            `channel_${channelId}`,
            msg.text
          ]
        );
        products.push(result.rows[0]);
      }
    }

    res.json({ inserted: products.length, products });
  } catch (err) {
    console.error("❌ Import failed:", err);
    res.status(500).json({ message: "Telegram import failed." });
  }
};

export const handleProductSearch = async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string) || "";
    const products = await searchProducts(query);

    return res.json(formatSuccessResponse("Products fetched successfully", products));
  } catch (err) {
    console.error("❌ Error while searching products:", err);
    return res.status(500).json(formatErrorResponse("Failed to fetch products"));
  }
};
