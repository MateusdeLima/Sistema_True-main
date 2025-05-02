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
      customers: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          cpf: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Row']>
      }
      products: {
        Row: {
          id: string
          name: string
          code: string
          default_price: number
          memory: string | null
          color: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['products']['Row']>
      }
      receipts: {
        Row: {
          id: string
          customer_id: string
          total_amount: number
          payment_method: string
          installments: number
          installment_value: number
          created_at: string
          created_by: string
          employee_id: string
          warranty_duration_months: number | null
          warranty_expires_at: string | null
          customers?: {
            id: string
            full_name: string
            email: string | null
            phone: string | null
          }
          receipt_items?: Array<{
            id: string
            product_id: string
            quantity: number
            price: number
            products?: {
              id: string
              name: string
              code: string
            }
          }>
        }
        Insert: Omit<Database['public']['Tables']['receipts']['Row'], 'id' | 'created_at' | 'customers' | 'receipt_items'>
        Update: Partial<Omit<Database['public']['Tables']['receipts']['Row'], 'customers' | 'receipt_items'>>
      }
      receipt_items: {
        Row: {
          id: string
          receipt_id: string
          product_id: string
          quantity: number
          price: number
        }
        Insert: Omit<Database['public']['Tables']['receipt_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['receipt_items']['Row']>
      }
      employees: {
        Row: {
          id: string
          full_name: string
          whatsapp: string
          age: number
          role: 'admin' | 'manager' | 'seller'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['employees']['Row']>
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'seller'
          preferences: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
    }
  }
}

export interface Employee {
  id: string;
  full_name: string;
  whatsapp: string;
  age: number;
  role: 'admin' | 'manager' | 'seller';
  created_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Receipt {
  id: string;
  customer_id: string;
  total_amount: number;
  payment_method: string;
  installments: number;
  installment_value: number;
  created_at: string;
  created_by: string;
  employee_id: string;
  warranty_duration_months: number | null;
  warranty_expires_at: string | null;
  customers?: Customer;
  receipt_items?: ReceiptItem[];
  employees?: Employee;
}
