export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          position: number
          active: boolean
          allow_half_half: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          position?: number
          active?: boolean
          allow_half_half?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
          active?: boolean
          allow_half_half?: boolean
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          price: number
          promo_price: number | null
          image_url: string | null
          available: boolean
          featured: boolean
          position: number
          min_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          price: number
          promo_price?: number | null
          image_url?: string | null
          available?: boolean
          featured?: boolean
          position?: number
          min_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          promo_price?: number | null
          image_url?: string | null
          available?: boolean
          featured?: boolean
          position?: number
          min_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_sizes: {
        Row: {
          id: string
          product_id: string
          label: string
          price: number
          promo_price: number | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          label: string
          price: number
          promo_price?: number | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          label?: string
          price?: number
          promo_price?: number | null
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      neighborhoods: {
        Row: {
          id: string
          name: string
          delivery_fee: number
          active: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          delivery_fee: number
          active?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          delivery_fee?: number
          active?: boolean
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          id: number
          store_name: string
          whatsapp_number: string
          opening_hours: string
          is_open: boolean
          min_order_value: number
          estimated_delivery_time: string
          logo_url: string | null
          banner_url: string | null
          promo_text: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          store_name?: string
          whatsapp_number?: string
          opening_hours?: string
          is_open?: boolean
          min_order_value?: number
          estimated_delivery_time?: string
          logo_url?: string | null
          banner_url?: string | null
          promo_text?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          store_name?: string
          whatsapp_number?: string
          opening_hours?: string
          is_open?: boolean
          min_order_value?: number
          estimated_delivery_time?: string
          logo_url?: string | null
          banner_url?: string | null
          promo_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_phone: string
          street: string
          number: string
          complement: string | null
          reference_point: string | null
          neighborhood_id: string
          payment_method: string
          change_for: number | null
          notes: string | null
          subtotal: number
          delivery_fee: number
          total: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_phone: string
          street: string
          number: string
          complement?: string | null
          reference_point?: string | null
          neighborhood_id: string
          payment_method: string
          change_for?: number | null
          notes?: string | null
          subtotal: number
          delivery_fee: number
          total: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_phone?: string
          street?: string
          number?: string
          complement?: string | null
          reference_point?: string | null
          neighborhood_id?: string
          payment_method?: string
          change_for?: number | null
          notes?: string | null
          subtotal?: number
          delivery_fee?: number
          total?: number
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
          notes: string | null
          subtotal: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
          notes?: string | null
          subtotal: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
          notes?: string | null
          subtotal?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_order: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_street: string
          p_number: string
          p_complement: string | null
          p_reference_point: string | null
          p_neighborhood_id: string
          p_payment_method: string
          p_change_for: number | null
          p_notes: string | null
          p_items: Json
        }
        Returns: {
          order_id: string
          subtotal: number
          delivery_fee: number
          total: number
        }[]
      }
    }
    Enums: Record<string, never>
  }
}
