import { Product } from "../models/product.model";
import { listRecords } from "../utils/dbUtils";

// Dummy in-memory products for now
const mockProducts: any[] = [
    {
        id: 1,
        product_name: "Premium Cotton T-Shirts (Bulk Pack)",
        price: 299,
        min_quantity: 50,
        source_channel: "MegaClothDeals",
        contact: {
            phone: "9876543210",
            whatsapp: "https://wa.me/919876543210",
        },
        posted_at: "2025-07-03T10:00:00Z",
        category: "Clothing",
        image: "/placeholder.svg?height=200&width=200",
        description:
            "High-quality cotton t-shirts available in multiple colors and sizes. Perfect for retail business with excellent profit margins.",
    },
    // Add more dummy products here...
];

// export const searchProducts = async (query: string): Promise<Product[]> => {
//     console.log("🔍 Searching products with query:", query);
//     return mockProducts.filter((p) =>
//         p.product_name.toLowerCase().includes(query.toLowerCase())
//     );
// };

export const searchProducts = async (query: string): Promise<Product[]> => {
  console.log("🔍 Searching products with query:", query);

  const records = await listRecords(
    `
    SELECT 
      p.id AS product_id,
      p.product_name,
      p.price,
      p.quantity,
      p.created_at AS product_created_at,

      -- Seller Info
      s.id AS seller_id,
      s.telegram_id AS seller_telegram_id,
      s.username AS seller_username,
      s.display_name AS seller_name,
      s.phone AS seller_phone,

      -- Message Info
      m.message_text,
      m.posted_at AS message_posted_at,

      -- Channel Info
      c.title AS channel_title

    FROM products p
    LEFT JOIN sellers s ON p.seller_id = s.id
    LEFT JOIN messages m ON p.message_id = m.id
    LEFT JOIN telegram_channels c ON p.source_channel_id = c.id

    WHERE LOWER(p.product_name) LIKE $1
    ORDER BY p.created_at DESC
    `,
    [`%${query.toLowerCase()}%`]
  );

  console.log("📦 Found products:", records.length);

  const formatted: any[] = records.map((p: any) => ({
    id: `p${p.product_id?.toString().padStart(3, "0")}`,
    name: p.product_name || "Unnamed Product",
    price: p.price || 0,
    min_quantity: p.quantity || 0,
    posted_at: p.message_posted_at || p.product_created_at || new Date(),

    channel: p.channel_title || "Unknown Channel",

    contact: {
      name: p.seller_name || "Unknown Seller",
      phone: p.seller_phone || "N/A",
      telegram: p.seller_username ? `https://t.me/${p.seller_username}` : "N/A",
      whatsapp: p.seller_phone
        ? `https://wa.me/${p.seller_phone.replace(/\D/g, "")}`
        : "https://wa.me/",
    },

    description: p.message_text || "No description available.",
    category: "General", // Placeholder if category logic isn't available yet
    image: "/placeholder.svg?height=200&width=200", // Placeholder until image support
  }));

  console.log("📦 Formatted products:", formatted);

  return formatted;
};
