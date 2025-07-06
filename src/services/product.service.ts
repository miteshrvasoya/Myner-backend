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
      id, product_name, price, quantity, seller_username, 
      source_channel, message_text, created_at
    FROM products
    WHERE LOWER(product_name) LIKE $1
       OR LOWER(message_text) LIKE $1
       OR LOWER(source_channel) LIKE $1
       OR LOWER(seller_username) LIKE $1
    ORDER BY created_at DESC
    `,
        [`%${query.toLowerCase()}%`]
    );

    console.log("📦 Found products:", records);

    const formatted: any[] = records.map((p: any) => ({
        id: `p${p.id.toString().padStart(3, "0")}`,
        name: p.product_name || "Unnamed Product",
        price: p.price || 0,
        min_quantity: p.quantity || 0,
        channel: p.source_channel || "Unknown Channel",
        contact: {
            phone: p.seller_username || "N/A",
            whatsapp: p.seller_username
                ? `https://wa.me/${p.seller_username.replace(/\D/g, "")}`
                : "https://wa.me/",
        },
        posted_at: p.created_at,
        category: "General",
        image: "/placeholder.svg?height=200&width=200",
        description: p.message_text || "No description available.",
    }));

    console.log("📦 Formatted products:", formatted);

    return formatted;
};