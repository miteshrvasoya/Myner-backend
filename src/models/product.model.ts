export interface Product {
  id?: number;
  product_name?: string;
  price?: number;
  quantity?: number;
  min_quantity?: number;
  seller_username?: string;
  source_channel?: string;
  message_text: string;
  created_at?: string;
  contact?: {
    phone?: string;
    whatsapp?: string;
  };
  posted_at?: string;
  category?: string;
  image?: string;
  description?: string;
}