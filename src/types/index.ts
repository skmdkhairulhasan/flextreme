export interface Product {
  id: string
  name: string
  slug: string
  price: number
  original_price?: number
  description: string
  images: string[]
  video_url?: string
  sizes: string[]
  colors: string[]
  category: string
  is_featured: boolean
  in_stock: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  name: string
  phone: string
  address: string
  product_id: string
  product_name: string
  size: string
  color: string
  quantity: number
  total_price: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderFormData {
  name: string
  phone: string
  address: string
  product_id: string
  product_name: string
  size: string
  color: string
  quantity: number
  total_price: number
  notes?: string
}

export type OrderStatus = Order['status']