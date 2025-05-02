import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  cpf: string | null;
};
type Product = Database['public']['Tables']['products']['Row'];
type Receipt = Database['public']['Tables']['receipts']['Row'];
type BaseReceiptItem = Database['public']['Tables']['receipt_items']['Row'];
type Employee = Database['public']['Tables']['employees']['Row'];

interface ReceiptItem extends BaseReceiptItem {
  imei?: string;
  type?: 'novo' | 'seminovo';
  manual_cost?: number;
}

interface Report {
  period: string;
  totalReceipts: number;
  totalAmount: number;
  paymentMethodTotals: Record<string, number>;
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    total: number;
  }>;
  averageWarrantyMonths: number;
  totalCost: number;
  totalProfit: number;
}

interface DataContextType {
  customers: Customer[];
  products: Product[];
  receipts: Receipt[];
  employees: Employee[];
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addReceipt: (receipt: Omit<Receipt, 'id' | 'created_at'>, items: Array<Omit<ReceiptItem, 'id' | 'receipt_id'>>) => Promise<Receipt | null>;
  updateReceipt: (id: string, data: Partial<Receipt>) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getProductById: (id: string) => Product | undefined;
  getReceiptById: (id: string) => Promise<{ receipt: Receipt; items: ReceiptItem[] } | null>;
  searchCustomers: (query: string) => Customer[];
  searchProducts: (query: string) => Product[];
  searchReceipts: (query: string) => Receipt[];
  generateReport: (startDate: string, endDate: string) => Promise<Report>;
  getExpiringWarranties: (days: number) => Promise<Array<{
    receipt: Receipt;
    customer: Customer;
    daysRemaining: number;
  }>>;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  searchEmployees: (query: string) => Employee[];
  getEmployeeById: (id: string) => Employee | undefined;
  updateReceiptItemPrice: (itemId: string, newPrice: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (user) {
      fetchCustomers();
      fetchProducts();
      fetchReceipts();
      fetchEmployees();
    }
  }, [user]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*');

    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }

    setCustomers(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('deleted', false);

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    setProducts(data || []);
  };

  const fetchReceipts = async () => {
    const { data, error } = await supabase
      .from('receipts')
      .select(`
        *,
        customers (
          id,
          full_name,
          email,
          phone
        ),
        receipt_items (
          id,
          product_id,
          quantity,
          price,
          type,
          manual_cost,
          products (
            id,
            name,
            code,
            price,
            memory,
            color
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching receipts:', error);
      return;
    }

    setReceipts(data || []);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*');

    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }

    setEmployees(data || []);
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Verificar se já existe um cliente com o mesmo email
      if (customerData.email) {
        const { data: existingCustomers, error: searchError } = await supabase
          .from('customers')
          .select('id, email')
          .eq('email', customerData.email);

        if (searchError) {
          console.error('Erro ao verificar cliente existente:', searchError);
          throw new Error('Erro ao verificar cliente existente');
        }

        if (existingCustomers && existingCustomers.length > 0) {
          throw new Error('Já existe um cliente cadastrado com este email');
        }
      }

      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCustomers(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      throw error;
    }
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    try {
      const { data: updatedCustomer, error } = await supabase
        .from('customers')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (updatedCustomer) {
        setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      // Verificar se o cliente possui recibos
      const { data: customerReceipts, error: receiptsError } = await supabase
        .from('receipts')
        .select('id')
        .eq('customer_id', id);

      if (receiptsError) throw receiptsError;

      if (customerReceipts && customerReceipts.length > 0) {
        throw new Error('Não é possível excluir este cliente pois existem recibos associados a ele.');
      }

      // Se não houver recibos, prosseguir com a exclusão
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw error;
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'created_at'>) => {
    try {
      // Verificar se já existe um produto com o mesmo código
      const { data: existingProducts, error: searchError } = await supabase
        .from('products')
        .select('id, code')
        .eq('code', product.code)
        .eq('deleted', false);

      if (searchError) {
        console.error('Erro ao verificar produto existente:', searchError);
        throw new Error('Erro ao verificar produto existente');
      }

      if (existingProducts && existingProducts.length > 0) {
        throw new Error('Já existe um produto com este código');
      }

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...product,
          deleted: false
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setProducts(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const { error } = await supabase
      .from('products')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()  // Usar delete() em vez de update({ deleted: true })
      .eq('id', id);

    if (error) throw error;
    await fetchProducts();
  };

  const addReceipt = async (receiptData: Omit<Receipt, 'id' | 'created_at'>, receiptItems: Array<Omit<ReceiptItem, 'id' | 'receipt_id'>>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      // Criar o recibo com employee_id e created_by corretos
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert([{
          customer_id: receiptData.customer_id,
          total_amount: receiptData.total_amount,
          payment_method: receiptData.payment_method,
          installments: receiptData.installments,
          installment_value: receiptData.installment_value,
          warranty_duration_months: receiptData.warranty_duration_months,
          warranty_expires_at: receiptData.warranty_expires_at,
          employee_id: receiptData.employee_id,
          created_by: user.id
        }])
        .select()
        .single();

      if (receiptError) {
        console.error('Erro ao adicionar recibo:', receiptError);
        return null;
      }

      if (receipt) {
        // Adicionar os itens do recibo
        const { data: items, error: itemsError } = await supabase
          .from('receipt_items')
          .insert(
            receiptItems.map(item => ({
              receipt_id: receipt.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              type: item.type,
              manual_cost: item.type === 'seminovo' ? item.manual_cost : null,
              imei: item.imei,
            }))
          )
          .select(`
            id,
            product_id,
            quantity,
            price,
            type,
            manual_cost,
            products (
              id,
              name,
              code,
              price,
              memory,
              color
            )
          `);

        if (itemsError) {
          console.error('Erro ao adicionar itens do recibo:', itemsError);
          // Deletar o recibo se houver erro ao adicionar os itens
          await supabase.from('receipts').delete().eq('id', receipt.id);
          return null;
        }

        const completeReceipt = {
          ...receipt,
          receipt_items: items
        };

        // Atualizar o estado local com o recibo completo
        setReceipts(prev => [completeReceipt, ...prev]);
        return completeReceipt;
      }
      return null;
    } catch (error) {
      console.error('Erro ao adicionar recibo:', error);
      return null;
    }
  };

  const updateReceipt = async (id: string, data: Partial<Receipt>) => {
    const { error } = await supabase
      .from('receipts')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    await fetchReceipts();
  };

  const deleteReceipt = async (id: string) => {
    try {
      // Primeiro, deletar o recibo (os itens serão deletados automaticamente devido ao ON DELETE CASCADE)
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar o estado local removendo o recibo
      setReceipts(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Erro ao deletar recibo:', error);
      throw error;
    }
  };

  const getCustomerById = (id: string) =>
    customers.find((c) => c.id === id);

  const getProductById = (id: string) =>
    products.find((p) => p.id === id);

  const getReceiptById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          customers (id, full_name, email, phone),
          receipt_items (
            id,
            product_id,
            quantity,
            price,
            products (id, name, code)
          ),
          employees!inner (
            id,
            full_name,
            whatsapp,
            role
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar recibo:', error);
        return null;
      }

      if (!data) return null;

      return {
        receipt: data,
        items: data.receipt_items || [],
        employee: data.employees
      };
    } catch (error) {
      console.error('Erro ao buscar recibo:', error);
      return null;
    }
  };

  const searchCustomers = (query: string) => {
    const searchTerm = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm)) ||
        (c.phone && c.phone.toLowerCase().includes(searchTerm)) ||
        (c.cpf && c.cpf.toLowerCase().includes(searchTerm))
    );
  };

  const searchProducts = (query: string) => {
    const searchTerm = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.code.toLowerCase().includes(searchTerm)
    );
  };

  const searchReceipts = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return receipts.filter(
      (r) =>
        r.customer_id.toLowerCase().includes(lowercaseQuery) ||
        r.payment_method.toLowerCase().includes(lowercaseQuery)
    );
  };

  const generateReport = async (startDate: string, endDate: string): Promise<Report> => {
    try {
      // Converter as datas para timestamps UNIX (em segundos)
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const startTimestamp = Math.floor(start.getTime() / 1000);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const endTimestamp = Math.floor(end.getTime() / 1000);

      const { data: periodReceipts, error } = await supabase
        .from('receipts')
        .select(`
          *,
          receipt_items (
            id,
            product_id,
            quantity,
            price,
            type,
            manual_cost
          )
        `)
        .gte('created_at', new Date(startTimestamp * 1000).toISOString())
        .lt('created_at', new Date((endTimestamp + 86400) * 1000).toISOString());

      if (error) {
        console.error('Erro ao gerar relatório:', error);
        throw error;
      }

      // Log para debug
      console.log('Período consultado:', {
        start: new Date(startTimestamp * 1000).toISOString(),
        end: new Date((endTimestamp + 86400) * 1000).toISOString(),
        receiptsCount: periodReceipts?.length || 0
      });

      const receiptsData = periodReceipts || [];

      // Log dos recibos encontrados para debug
      receiptsData.forEach(receipt => {
        console.log('Recibo encontrado:', {
          id: receipt.id,
          created_at: receipt.created_at,
          total: receipt.total_amount
        });
      });

      // Resto do código permanece igual
      const totalAmount = receiptsData.reduce((acc, r) => {
        const items = (r.receipt_items as ReceiptItem[]) || [];
        return acc + items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }, 0);

      const paymentMethodTotals: Record<string, number> = {};
      receiptsData.forEach((receipt) => {
        const paymentMethod = receipt.payment_method || 'Não especificado';
        const items = (receipt.receipt_items as ReceiptItem[]) || [];
        const valorVenda = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        paymentMethodTotals[paymentMethod] = (paymentMethodTotals[paymentMethod] || 0) + valorVenda;
      });

      const productQuantities: Record<string, { quantity: number; total: number }> = {};

      receiptsData.forEach((receipt) => {
        const items = (receipt.receipt_items as ReceiptItem[]) || [];
        items.forEach((item) => {
          if (!productQuantities[item.product_id]) {
            productQuantities[item.product_id] = {
              quantity: 0,
              total: 0,
            };
          }
          productQuantities[item.product_id].quantity += item.quantity || 0;
          productQuantities[item.product_id].total += Number(item.price || 0) * (item.quantity || 0);
        });
      });

      const topProducts = await Promise.all(
        Object.entries(productQuantities)
          .map(async ([productId, stats]) => {
            const product = await getProductById(productId);
            return {
              productId,
              name: product?.name || 'Produto Removido',
              quantity: stats.quantity,
              total: stats.total,
            };
          })
      );

      topProducts.sort((a, b) => b.quantity - a.quantity);

      const totalWarrantyMonths = receiptsData.reduce(
        (acc, r) => acc + (r.warranty_duration_months || 0),
        0
      );

      const averageWarrantyMonths = receiptsData.length > 0 
        ? totalWarrantyMonths / receiptsData.length 
        : 0;

      let totalCost = 0;
      let totalProfit = 0;
      receiptsData.forEach((receipt) => {
        const items = (receipt.receipt_items as ReceiptItem[]) || [];
        items.forEach((item) => {
          const product = products.find(p => p.id === item.product_id);
          let cost;
          if (item.type === 'seminovo' && item.manual_cost !== undefined) {
            cost = Number(item.manual_cost) * item.quantity;
          } else {
            cost = product ? Number(product.default_price) * item.quantity : 0;
          }
          const sale = item.price * item.quantity;
          totalCost += cost;
          totalProfit += (sale - cost);
        });
      });

      return {
        period: `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`,
        totalReceipts: receiptsData.length,
        totalAmount,
        paymentMethodTotals,
        topProducts: topProducts.slice(0, 10),
        averageWarrantyMonths,
        totalCost,
        totalProfit,
      };
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  };

  const getExpiringWarranties = async (days: number) => {
    const now = new Date();
    const { data: expiringReceipts, error } = await supabase
      .from('receipts')
      .select(`
        *,
        customers!inner(*)
      `)
      .not('warranty_expires_at', 'is', null);

    if (error) throw error;

    return expiringReceipts
      .filter((r) => {
        if (!r.warranty_expires_at) return false;
        const expiryDate = new Date(r.warranty_expires_at);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry >= 0 && daysUntilExpiry <= days;
      })
      .map((receipt) => {
        const expiryDate = new Date(receipt.warranty_expires_at!);
        const daysRemaining = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          receipt,
          customer: receipt.customers as Customer,
          daysRemaining,
        };
      });
  };

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    const { data, error } = await supabase
      .from('employees')
      .insert([employee])
      .select()
      .single();

    if (error) {
      console.error('Error adding employee:', error);
      return;
    }

    setEmployees([...employees, data]);
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee:', error);
      return;
    }

    setEmployees(employees.map(e => e.id === id ? data : e));
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      throw error;
    }
  };

  const searchEmployees = (query: string) => {
    const searchTerm = query.toLowerCase();
    return employees.filter(
      (e) =>
        e.full_name.toLowerCase().includes(searchTerm) ||
        e.whatsapp.toLowerCase().includes(searchTerm)
    );
  };

  const getEmployeeById = (id: string) =>
    employees.find((e) => e.id === id);

  // Atualizar valor de um item do recibo
  const updateReceiptItemPrice = async (itemId: string, newPrice: number) => {
    const { error } = await supabase
      .from('receipt_items')
      .update({ price: newPrice })
      .eq('id', itemId);
    if (error) throw error;
    await fetchReceipts();
  };

  return (
    <DataContext.Provider
      value={{
        customers,
        products,
        receipts,
        employees,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        deleteProduct,
        addReceipt,
        updateReceipt,
        deleteReceipt,
        getCustomerById,
        getProductById,
        getReceiptById,
        searchCustomers,
        searchProducts,
        searchReceipts,
        generateReport,
        getExpiringWarranties,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        searchEmployees,
        getEmployeeById,
        updateReceiptItemPrice,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}