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
          min_quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          position?: number
          active?: boolean
          allow_half_half?: boolean
          min_quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          position?: number
          active?: boolean
          allow_half_half?: boolean
          min_quantity?: number
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
          pricing_type: string
          price_per_kg: number | null
          max_weight_grams: number | null
          internal_code: string | null
          track_stock: boolean
          stock_quantity: number
          allow_modifiers: boolean
          allow_notes: boolean
          visible_menu: boolean
          visible_pos: boolean
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
          pricing_type?: string
          price_per_kg?: number | null
          max_weight_grams?: number | null
          internal_code?: string | null
          track_stock?: boolean
          stock_quantity?: number
          allow_modifiers?: boolean
          allow_notes?: boolean
          visible_menu?: boolean
          visible_pos?: boolean
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
          pricing_type?: string
          price_per_kg?: number | null
          max_weight_grams?: number | null
          internal_code?: string | null
          track_stock?: boolean
          stock_quantity?: number
          allow_modifiers?: boolean
          allow_notes?: boolean
          visible_menu?: boolean
          visible_pos?: boolean
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
          estimated_time: string | null
          min_order_value: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          delivery_fee: number
          active?: boolean
          position?: number
          estimated_time?: string | null
          min_order_value?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          delivery_fee?: number
          active?: boolean
          position?: number
          estimated_time?: string | null
          min_order_value?: number | null
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
          order_number: number
          customer_name: string
          customer_phone: string
          street: string | null
          number: string | null
          complement: string | null
          reference_point: string | null
          neighborhood_id: string | null
          payment_method: string | null
          change_for: number | null
          notes: string | null
          subtotal: number
          delivery_fee: number
          discount: number
          total: number
          status: string
          order_type: string
          table_number: string | null
          pickup_at: string | null
          source: string
          created_by: string | null
          cash_register_id: string | null
          customer_id: string | null
          is_open_tab: boolean
          created_at: string
        }
        Insert: {
          id?: string
          order_number?: number
          customer_name: string
          customer_phone: string
          street?: string | null
          number?: string | null
          complement?: string | null
          reference_point?: string | null
          neighborhood_id?: string | null
          payment_method?: string | null
          change_for?: number | null
          notes?: string | null
          subtotal: number
          delivery_fee: number
          discount?: number
          total: number
          status?: string
          order_type?: string
          table_number?: string | null
          pickup_at?: string | null
          source?: string
          created_by?: string | null
          cash_register_id?: string | null
          customer_id?: string | null
          is_open_tab?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          order_number?: number
          customer_name?: string
          customer_phone?: string
          street?: string | null
          number?: string | null
          complement?: string | null
          reference_point?: string | null
          neighborhood_id?: string | null
          payment_method?: string | null
          change_for?: number | null
          notes?: string | null
          subtotal?: number
          delivery_fee?: number
          discount?: number
          total?: number
          status?: string
          order_type?: string
          table_number?: string | null
          pickup_at?: string | null
          source?: string
          created_by?: string | null
          cash_register_id?: string | null
          customer_id?: string | null
          is_open_tab?: boolean
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
          sale_type: string
          weight_grams: number | null
          price_per_kg: number | null
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
          sale_type?: string
          weight_grams?: number | null
          price_per_kg?: number | null
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
          sale_type?: string
          weight_grams?: number | null
          price_per_kg?: number | null
        }
        Relationships: []
      }
      order_item_modifiers: {
        Row: {
          id: string
          order_item_id: string
          modifier_id: string | null
          modifier_name: string
          price: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          order_item_id: string
          modifier_id?: string | null
          modifier_name: string
          price: number
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          order_item_id?: string
          modifier_id?: string | null
          modifier_name?: string
          price?: number
          quantity?: number
          created_at?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: string
          changed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          status: string
          changed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          status?: string
          changed_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          street: string | null
          number: string | null
          neighborhood_id: string | null
          complement: string | null
          reference_point: string | null
          notes: string | null
          last_order_at: string | null
          orders_count: number
          total_spent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          street?: string | null
          number?: string | null
          neighborhood_id?: string | null
          complement?: string | null
          reference_point?: string | null
          notes?: string | null
          last_order_at?: string | null
          orders_count?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          street?: string | null
          number?: string | null
          neighborhood_id?: string | null
          complement?: string | null
          reference_point?: string | null
          notes?: string | null
          last_order_at?: string | null
          orders_count?: number
          total_spent?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      modifier_groups: {
        Row: {
          id: string
          name: string
          min_select: number
          max_select: number
          required: boolean
          position: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          min_select?: number
          max_select?: number
          required?: boolean
          position?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          min_select?: number
          max_select?: number
          required?: boolean
          position?: number
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      modifiers: {
        Row: {
          id: string
          group_id: string
          name: string
          price: number
          active: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          price?: number
          active?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          price?: number
          active?: boolean
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      product_modifier_groups: {
        Row: {
          product_id: string
          modifier_group_id: string
          position: number
        }
        Insert: {
          product_id: string
          modifier_group_id: string
          position?: number
        }
        Update: {
          product_id?: string
          modifier_group_id?: string
          position?: number
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          id: string
          code: string
          name: string
          active: boolean
          allows_change: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          active?: boolean
          allows_change?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          active?: boolean
          allows_change?: boolean
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          order_id: string
          payment_method_id: string
          amount: number
          received_amount: number | null
          change_amount: number | null
          cash_register_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          payment_method_id: string
          amount: number
          received_amount?: number | null
          change_amount?: number | null
          cash_register_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          payment_method_id?: string
          amount?: number
          received_amount?: number | null
          change_amount?: number | null
          cash_register_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      cash_registers: {
        Row: {
          id: string
          opened_by: string
          opened_at: string
          opening_amount: number
          opening_notes: string | null
          closed_by: string | null
          closed_at: string | null
          closing_notes: string | null
          counted_cash_amount: number | null
          expected_cash_amount: number | null
          cash_difference: number | null
          status: string
        }
        Insert: {
          id?: string
          opened_by: string
          opened_at?: string
          opening_amount: number
          opening_notes?: string | null
          closed_by?: string | null
          closed_at?: string | null
          closing_notes?: string | null
          counted_cash_amount?: number | null
          expected_cash_amount?: number | null
          cash_difference?: number | null
          status?: string
        }
        Update: {
          id?: string
          opened_by?: string
          opened_at?: string
          opening_amount?: number
          opening_notes?: string | null
          closed_by?: string | null
          closed_at?: string | null
          closing_notes?: string | null
          counted_cash_amount?: number | null
          expected_cash_amount?: number | null
          cash_difference?: number | null
          status?: string
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          id: string
          cash_register_id: string
          type: string
          amount: number
          payment_method_id: string | null
          order_id: string | null
          description: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cash_register_id: string
          type: string
          amount: number
          payment_method_id?: string | null
          order_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cash_register_id?: string
          type?: string
          amount?: number
          payment_method_id?: string | null
          order_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: number
          require_open_register_for_cash: boolean
          default_max_weight_grams: number
          updated_at: string
        }
        Insert: {
          id?: number
          require_open_register_for_cash?: boolean
          default_max_weight_grams?: number
          updated_at?: string
        }
        Update: {
          id?: number
          require_open_register_for_cash?: boolean
          default_max_weight_grams?: number
          updated_at?: string
        }
        Relationships: []
      }
      printer_settings: {
        Row: {
          id: number
          paper_width: string
          print_kitchen_copy: boolean
          print_customer_receipt: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          paper_width?: string
          print_kitchen_copy?: boolean
          print_customer_receipt?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          paper_width?: string
          print_kitchen_copy?: boolean
          print_customer_receipt?: boolean
          updated_at?: string
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
          p_street: string | null
          p_number: string | null
          p_complement: string | null
          p_reference_point: string | null
          p_neighborhood_id: string | null
          p_payment_method: string
          p_change_for: number | null
          p_notes: string | null
          p_items: Json
          p_order_type?: string
        }
        Returns: {
          order_id: string
          subtotal: number
          delivery_fee: number
          total: number
        }[]
      }
      create_pos_order: {
        Args: {
          p_order_type: string
          p_customer_name: string | null
          p_customer_phone: string | null
          p_table_number: string | null
          p_street: string | null
          p_number: string | null
          p_complement: string | null
          p_reference_point: string | null
          p_neighborhood_id: string | null
          p_pickup_at: string | null
          p_notes: string | null
          p_discount: number | null
          p_items: Json
          p_payments: Json
          p_cash_register_id: string | null
        }
        Returns: {
          order_id: string
          order_number: number
          subtotal: number
          discount: number
          delivery_fee: number
          total: number
        }[]
      }
      cash_register_expected_cash: {
        Args: { p_cash_register_id: string }
        Returns: number
      }
      open_table_order: {
        Args: {
          p_table_number: string
          p_customer_name: string | null
          p_notes: string | null
          p_items: Json
        }
        Returns: {
          order_id: string
          order_number: number
          subtotal: number
          total: number
        }[]
      }
      add_items_to_table_order: {
        Args: { p_order_id: string; p_items: Json }
        Returns: {
          order_id: string
          order_number: number
          subtotal: number
          total: number
        }[]
      }
      close_table_order: {
        Args: {
          p_order_id: string
          p_discount: number | null
          p_notes: string | null
          p_payments: Json
          p_cash_register_id: string | null
        }
        Returns: {
          order_id: string
          order_number: number
          subtotal: number
          discount: number
          total: number
        }[]
      }
      remove_item_from_table_order: {
        Args: { p_order_item_id: string }
        Returns: {
          order_id: string
          subtotal: number
          total: number
        }[]
      }
    }
    Enums: Record<string, never>
  }
}
