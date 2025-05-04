import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Search, PlusCircle, FileText, Trash2, MessageCircle, X, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/notifications';
import { generateReceiptPDF } from '../utils/pdf';
import toast from 'react-hot-toast';
import { Database } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';

type Receipt = Database['public']['Tables']['receipts']['Row'];
type ReceiptItem = Database['public']['Tables']['receipt_items']['Row'] & {
  imei?: string;
  type?: 'novo' | 'seminovo';
  manual_cost?: number;
  products?: {
    id: string;
    name: string;
    code: string;
  };
};

interface FormItem {
  productId: string;
  quantity: number;
  price: number;
  imei: string;
  type: 'novo' | 'seminovo';
  manualCost?: number;
}

interface ReceiptFormData {
  customerId: string;
  employeeId: string;
  items: FormItem[];
  paymentMethod: string;
  installments: number;
  warranty: {
    durationMonths: number;
  };
  date: string;
  warrantyExpiresAt: string;
  customFields: Record<string, string>;
}

type ProductField = 'productId' | 'quantity' | 'price' | 'imei' | 'type' | 'manualCost';

// Adicione a interface para o tipo de retorno de getReceiptById
interface ReceiptData {
  receipt: {
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
    customers?: any;
    receipt_items?: Array<{
      id: string;
      product_id: string;
      quantity: number;
      price: number;
      imei?: string;
    }>;
  };
}

function Receipts() {
  const {
    receipts,
    customers,
    products,
    employees,
    addReceipt,
    deleteReceipt,
    searchProducts,
    getReceiptById,
    updateReceipt,
    updateReceiptItemPrice,
  } = useData();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Estado inicial do formulário
  const initialFormData: ReceiptFormData = {
    customerId: '',
    employeeId: '',
    items: [{ productId: '', quantity: 1, price: 0, imei: '', type: 'novo', manualCost: undefined }],
    paymentMethod: 'Dinheiro',
    installments: 0,
    warranty: { durationMonths: 0 },
    date: new Date().toISOString().split('T')[0],
    warrantyExpiresAt: '',
    customFields: {},
  };

  // Estados
  const [formData, setFormData] = useState<ReceiptFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  // Estado para edição de preço de item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemPrice, setEditingItemPrice] = useState<number>(0);
  // 1. Estados para modais
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);
  const [showImeiModal, setShowImeiModal] = useState(false);
  const [imeiToShow, setImeiToShow] = useState<string | null>(null);
  const [openProductDropdown, setOpenProductDropdown] = useState<number | null>(null);
  // Adicione os estados logo após os outros estados existentes
  const [openCustomerDropdown, setOpenCustomerDropdown] = useState<number | null>(null);
  const [openEmployeeDropdown, setOpenEmployeeDropdown] = useState<number | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [employeeQuery, setEmployeeQuery] = useState('');

  // Listas filtradas computadas
  const filteredProducts = useMemo(() => 
    productQuery ? searchProducts(productQuery) : products
  , [productQuery, products, searchProducts]);

  const memoizedGetCustomerById = useMemo(() => 
    (id: string) => customers.find(c => c.id === id),
    [customers]
  );

  const memoizedGetEmployeeById = useMemo(() => 
    (id: string) => employees.find(e => e.id === id),
    [employees]
  );

  const searchReceipts = useMemo(() => (query: string) => {
    return receipts.filter((receipt: Receipt) => {
      const customer = memoizedGetCustomerById(receipt.customer_id);
      const employee = memoizedGetEmployeeById(receipt.employee_id);
      const searchString = `${customer?.full_name} ${employee?.full_name} ${receipt.payment_method}`.toLowerCase();
      return searchString.includes(query.toLowerCase());
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [receipts, memoizedGetCustomerById, memoizedGetEmployeeById]);

  const filteredReceipts = useMemo(() => 
    searchQuery ? searchReceipts(searchQuery) : receipts,
    [searchQuery, searchReceipts, receipts]
  );

  // Adicione as listas filtradas computadas
  const filteredCustomers = useMemo(() => 
    customerQuery ? customers.filter(c => c.full_name.toLowerCase().includes(customerQuery.toLowerCase())) : customers
  , [customerQuery, customers]);

  const filteredEmployees = useMemo(() => 
    employeeQuery ? employees.filter(e => e.full_name.toLowerCase().includes(employeeQuery.toLowerCase())) : employees
  , [employeeQuery, employees]);

  useEffect(() => {
    const loadReceiptData = async () => {
      if (editingReceipt) {
        const receiptData = await getReceiptById(editingReceipt.id) as unknown as ReceiptData;
        if (receiptData && receiptData.receipt.receipt_items) {
          setFormData({
            ...initialFormData,
            customerId: editingReceipt.customer_id,
            employeeId: editingReceipt.employee_id,
            paymentMethod: editingReceipt.payment_method,
            installments: editingReceipt.installments,
            warranty: {
              durationMonths: editingReceipt.warranty_duration_months || 0
            },
            warrantyExpiresAt: editingReceipt.warranty_expires_at || '',
            date: new Date(editingReceipt.created_at).toISOString().split('T')[0],
            items: receiptData.receipt.receipt_items.map((item: { product_id: string; quantity: number; price: number; imei?: string }) => ({
              productId: item.product_id,
              quantity: item.quantity,
              price: item.price,
              imei: item.imei || '',
              type: 'novo',
              manualCost: undefined
            }))
          });
        }
      }
    };

    loadReceiptData();
  }, [editingReceipt, getReceiptById, initialFormData]);

  const calculateTotals = () => {
    const total = formData.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalCost = formData.items.reduce((acc, item) => {
      if (item.type === 'seminovo') {
        return acc + (item.manualCost || 0) * item.quantity;
      } else {
        const product = products.find(p => p.id === item.productId);
        return acc + (product ? product.default_price * item.quantity : 0);
      }
    }, 0);
    const installmentValue = formData.installments > 0 ? total / formData.installments : total;
    return { total, installmentValue, totalCost };
  };

  // Função para formatar o IMEI
  const formatIMEI = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 15 dígitos
    const limitedNumbers = numbers.slice(0, 15);
    
    // Aplica a máscara
    let formattedIMEI = '';
    if (limitedNumbers.length <= 6) {
      formattedIMEI = limitedNumbers;
    } else if (limitedNumbers.length <= 8) {
      formattedIMEI = `${limitedNumbers.slice(0, 6)}-${limitedNumbers.slice(6)}`;
    } else if (limitedNumbers.length <= 14) {
      formattedIMEI = `${limitedNumbers.slice(0, 6)}-${limitedNumbers.slice(6, 8)}-${limitedNumbers.slice(8)}`;
    } else {
      formattedIMEI = `${limitedNumbers.slice(0, 6)}-${limitedNumbers.slice(6, 8)}-${limitedNumbers.slice(8, 14)}-${limitedNumbers.slice(14)}`;
    }
    
    return formattedIMEI;
  };

  // Função para validar o IMEI
  const validateIMEI = (imei: string) => {
    const pattern = /^\d{6}-\d{2}-\d{6}-\d$/;
    return pattern.test(imei);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formato do IMEI para todos os produtos
    const invalidIMEI = formData.items.some(item => item.imei && !validateIMEI(item.imei));
    if (invalidIMEI) {
      toast.error('Por favor, preencha o IMEI no formato correto: 000000-00-000000-0');
      return;
    }

    try {
      const { installmentValue, totalCost } = calculateTotals();
      
      const receiptData = {
        customer_id: formData.customerId,
        total_amount: totalCost,
        payment_method: formData.paymentMethod,
        installments: formData.installments,
        installment_value: installmentValue,
        warranty_duration_months: formData.warranty.durationMonths,
        warranty_expires_at: formData.warrantyExpiresAt,
        employee_id: formData.employeeId,
        created_by: formData.employeeId
      };

      const receiptItems = formData.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        imei: item.imei, // Garantindo que o IMEI seja incluído
        type: item.type,
        manual_cost: item.type === 'seminovo' ? item.manualCost : undefined
      }));

      let newReceipt;
      if (editingReceipt) {
        await updateReceipt(editingReceipt.id, receiptData);
      } else {
        newReceipt = await addReceipt(receiptData, receiptItems);
      }

      setShowAddModal(false);
      setEditingReceipt(null);
      setFormData(initialFormData);
      toast.success('Recibo salvo com sucesso!');

      if (newReceipt && newReceipt.receipt_items) {
        setTimeout(() => {
          newReceipt.receipt_items.forEach((item: ReceiptItem) => {
            startEditItemPrice(item.id, item.price);
          });
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao salvar recibo:', error);
      toast.error('Erro ao salvar recibo. Verifique se todos os campos obrigatórios foram preenchidos.');
    }
  };

  const handleDelete = (id: string) => {
    setReceiptToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (receiptToDelete) {
      await deleteReceipt(receiptToDelete);
      toast.success('Recibo excluído com sucesso!');
      setShowDeleteModal(false);
      setReceiptToDelete(null);
    }
  };

  const handlePrint = async (receipt: Receipt) => {
    const customer = memoizedGetCustomerById(receipt.customer_id);
    const employee = memoizedGetEmployeeById(receipt.employee_id);
    if (!customer) {
      toast.error('Cliente não encontrado');
      return;
    }
    if (!employee) {
      toast.error('Funcionário não encontrado');
      return;
    }

    // Buscar os itens do recibo do banco de dados
    const receiptData = await getReceiptById(receipt.id) as unknown as ReceiptData;
    if (!receiptData || !receiptData.receipt.receipt_items) {
      toast.error('Não foi possível encontrar os itens do recibo');
      return;
    }

    // Mapear os itens incluindo o IMEI
    const receiptProducts = receiptData.receipt.receipt_items.map((item: { product_id: string; quantity: number; price: number; imei?: string }) => ({
      name: products.find(p => p.id === item.product_id)?.name || 'Produto',
      quantity: item.quantity,
      price: item.price,
      imei: item.imei
    }));

    try {
      const pdfBlob = await generateReceiptPDF(
        receipt,
        customer.full_name,
        customer.cpf,
        receiptProducts,
        employee.full_name
      );

      // Formatar a data para o nome do arquivo
      const dataFormatada = new Date(receipt.created_at).toLocaleDateString('pt-BR').replace(/\//g, '-');
      const nomeArquivo = `recibo ${customer.full_name} ${dataFormatada}.pdf`;

      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nomeArquivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o PDF do recibo');
    }
  };

  const handleWhatsApp = (receipt: Receipt) => {
    const customer = memoizedGetCustomerById(receipt.customer_id);
    if (!customer?.phone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    const phone = customer.phone.replace(/\D/g, '');
    const message = `Olá ${customer.full_name}, segue o recibo da sua compra:`;
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleProductChange = (index: number, field: ProductField, value: string | number) => {
    const newItems = [...formData.items];
    if (field === 'productId') {
      const selectedProduct = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value as string,
        price: 0,
        manualCost: undefined,
        type: 'novo',
      };
    } else if (field === 'quantity') {
      newItems[index] = {
        ...newItems[index],
        quantity: typeof value === 'string' ? parseInt(value) : value
      };
    } else if (field === 'price') {
      newItems[index] = {
        ...newItems[index],
        price: typeof value === 'string' ? parseFloat(value) : value
      };
    } else if (field === 'imei') {
      newItems[index] = {
        ...newItems[index],
        imei: formatIMEI(value as string)
      };
    } else if (field === 'type') {
      if (value === 'seminovo') {
        newItems[index] = {
          ...newItems[index],
          type: 'seminovo',
          manualCost: undefined,
          price: 0
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          type: 'novo',
          manualCost: undefined,
          price: 0
        };
      }
    } else if (field === 'manualCost') {
      const cost = typeof value === 'string' ? parseFloat(value) : value;
      newItems[index] = {
        ...newItems[index],
        manualCost: cost
      };
    }
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveProduct = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleAddProduct = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, price: 0, imei: '', type: 'novo', manualCost: undefined }],
    });
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingReceipt(null);
    setFormData(initialFormData);
  };

  // Função para iniciar edição
  const startEditItemPrice = (itemId: string, currentPrice: number) => {
    setEditingItemId(itemId);
    setEditingItemPrice(currentPrice);
  };

  // Função para salvar edição
  const saveEditItemPrice = async (itemId: string) => {
    try {
      await updateReceiptItemPrice(itemId, editingItemPrice);
      setEditingItemId(null);
      toast.success('Valor do produto atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar valor do produto');
    }
  };

  // Substituir alert de IMEI por modal
  const handleShowImei = (imei: string | null) => {
    setImeiToShow(imei || 'Sem IMEI');
    setShowImeiModal(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar recibos..."
            className="border p-2 rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
          onClick={() => setShowAddModal(true)}
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Novo Recibo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReceipts.map((receipt: Receipt) => {
          const customer = memoizedGetCustomerById(receipt.customer_id);
          const employee = memoizedGetEmployeeById(receipt.employee_id);
          return (
            <div key={receipt.id} className="border p-4 rounded shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">{customer?.full_name || 'Cliente não encontrado'}</h3>
                  <p className="text-sm text-gray-600">
                    Atendido por: {employee?.full_name || 'Funcionário não encontrado'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePrint(receipt)}
                    className="text-blue-500 hover:text-blue-700"
                    title="Imprimir PDF"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleWhatsApp(receipt)}
                    className="text-green-500 hover:text-green-700"
                    title="Enviar por WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(receipt.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm">
                  Data: {new Date(receipt.created_at).toLocaleDateString('pt-BR')}
                </p>
                {isAdmin && (
                  <p className="text-sm">
                    Valor de Custo: {formatCurrency(receipt.total_amount)}
                  </p>
                )}
                <p className="text-sm">
                  Forma de Pagamento: {receipt.payment_method}
                  {receipt.installments > 1 && ` (${receipt.installments}x de ${formatCurrency(receipt.installment_value)})`}
                </p>
                {(receipt.warranty_duration_months ?? 0) > 0 && (
                  <p className="text-sm">
                    Garantia: {receipt.warranty_duration_months} meses
                  </p>
                )}
                {/* ITENS DO RECIBO E EDIÇÃO DE PREÇO */}
                {receipt.receipt_items && receipt.receipt_items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Produtos:</h4>
                    <ul className="space-y-2">
                      {receipt.receipt_items.map((item: any) => (
                        <li key={item.id} className="flex items-center gap-2">
                          <span className="flex-1">
                            {item.products?.name || 'Produto'} (Qtd: {item.quantity})
                          </span>
                          <span className="font-mono">{formatCurrency(item.price)}</span>
                          <button
                            className="text-blue-500 hover:text-blue-700"
                            title="Ver IMEI"
                            onClick={() => handleShowImei(item.imei)}
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-white w-full max-w-4xl mx-4 rounded-lg shadow-xl">
            <div className="absolute right-4 top-4">
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-6">
              {editingReceipt ? 'Editar Recibo' : 'Novo Recibo'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col h-[80vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-shrink-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full text-left rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => setOpenCustomerDropdown(openCustomerDropdown === 0 ? null : 0)}
                    >
                      {formData.customerId
                        ? (() => {
                            const c = customers.find(c => c.id === formData.customerId);
                            return c ? c.full_name : 'Selecione um cliente';
                          })()
                        : 'Selecione um cliente'}
                    </button>
                    {openCustomerDropdown === 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                        <input
                          type="text"
                          placeholder="Buscar clientes..."
                          value={customerQuery}
                          onChange={e => setCustomerQuery(e.target.value)}
                          className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                          autoFocus
                        />
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCustomers.length === 0 && (
                            <div className="px-3 py-2 text-gray-500">Nenhum cliente encontrado</div>
                          )}
                          {filteredCustomers.map((c) => (
                            <div
                              key={c.id}
                              className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${formData.customerId === c.id ? 'bg-blue-200' : ''}`}
                              onClick={() => {
                                setFormData({ ...formData, customerId: c.id });
                                setOpenCustomerDropdown(null);
                                setCustomerQuery('');
                              }}
                            >
                              {c.full_name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Funcionário</label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full text-left rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => setOpenEmployeeDropdown(openEmployeeDropdown === 0 ? null : 0)}
                    >
                      {formData.employeeId
                        ? (() => {
                            const e = employees.find(e => e.id === formData.employeeId);
                            return e ? e.full_name : 'Selecione um funcionário';
                          })()
                        : 'Selecione um funcionário'}
                    </button>
                    {openEmployeeDropdown === 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                        <input
                          type="text"
                          placeholder="Buscar funcionários..."
                          value={employeeQuery}
                          onChange={e => setEmployeeQuery(e.target.value)}
                          className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                          autoFocus
                        />
                        <div className="max-h-48 overflow-y-auto">
                          {filteredEmployees.length === 0 && (
                            <div className="px-3 py-2 text-gray-500">Nenhum funcionário encontrado</div>
                          )}
                          {filteredEmployees.map((e) => (
                            <div
                              key={e.id}
                              className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${formData.employeeId === e.id ? 'bg-blue-200' : ''}`}
                              onClick={() => {
                                setFormData({ ...formData, employeeId: e.id });
                                setOpenEmployeeDropdown(null);
                                setEmployeeQuery('');
                              }}
                            >
                              {e.full_name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento
                  </label>
                  <select
                    required
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="PIX">PIX</option>
                  </select>
                </div>

                {formData.paymentMethod === 'Cartão de Crédito' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Parcelas
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="12"
                      value={formData.installments === 0 ? '' : formData.installments}
                      onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Parcela"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Garantia (meses)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.warranty.durationMonths === 0 ? '' : formData.warranty.durationMonths}
                    onChange={e => {
                      const months = parseInt(e.target.value) || 0;
                      const baseDate = new Date(formData.date);
                      baseDate.setMonth(baseDate.getMonth() + months);
                      setFormData({
                        ...formData,
                        warranty: { durationMonths: months },
                        warrantyExpiresAt: months > 0 ? baseDate.toISOString().split('T')[0] : ''
                      });
                    }}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Garantia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Expiração da Garantia</label>
                  <input
                    type="date"
                    required
                    value={formData.warrantyExpiresAt}
                    readOnly
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-6 pr-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Produtos</label>
                <div className="space-y-4">
                  {formData.items.map((product, index) => (
                    <div key={index} className="border-b pb-4 mb-4">
                      {/* Dropdown customizado de produto */}
                      <div className="relative">
                        <button
                          type="button"
                          className="w-full text-left rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={() => setOpenProductDropdown(openProductDropdown === index ? null : index)}
                        >
                          {product.productId
                            ? (() => {
                                const p = filteredProducts.find(p => p.id === product.productId);
                                return p ? `${p.name} - ${p.code}${isAdmin ? ` - ${formatCurrency(p.default_price)}` : ''}` : 'Selecione um produto';
                              })()
                            : 'Selecione um produto'}
                        </button>
                        {openProductDropdown === index && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                            <input
                              type="text"
                              placeholder="Buscar produtos..."
                              value={productQuery}
                              onChange={e => setProductQuery(e.target.value)}
                              className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none"
                              autoFocus
                            />
                            <div className="max-h-48 overflow-y-auto">
                              {filteredProducts.length === 0 && (
                                <div className="px-3 py-2 text-gray-500">Nenhum produto encontrado</div>
                              )}
                              {filteredProducts.map((p) => (
                                <div
                                  key={p.id}
                                  className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${product.productId === p.id ? 'bg-blue-200' : ''}`}
                                  onClick={() => {
                                    handleProductChange(index, 'productId', p.id);
                                    setOpenProductDropdown(null);
                                    setProductQuery('');
                                  }}
                                >
                                  {p.name} - {p.code}{isAdmin ? ` - ${formatCurrency(p.default_price)}` : ''}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Campos abaixo ocupando toda a largura exceto valores */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={product.quantity}
                            onChange={e => handleProductChange(index, 'quantity', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Quantidade"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
                          <input
                            type="text"
                            placeholder="IMEI"
                            value={product.imei}
                            onChange={e => handleProductChange(index, 'imei', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            pattern="\d{6}-\d{2}-\d{6}-\d"
                            title="Formato: 000000-00-000000-0"
                            required
                          />
                          {product.imei && !validateIMEI(product.imei) && (
                            <p className="text-xs text-gray-500 mt-1">Formato: 000000-00-000000-0</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                          <select
                            value={product.type}
                            onChange={e => handleProductChange(index, 'type', e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="novo">Novo</option>
                            <option value="seminovo">Seminovo</option>
                          </select>
                        </div>
                      </div>
                      {/* Seção de valores */}
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Valores</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor de venda</label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="0.01"
                              value={product.price === 0 ? '' : product.price}
                              onChange={e => handleProductChange(index, 'price', e.target.value)}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Valor de venda"
                            />
                          </div>
                          {product.type === 'seminovo' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Valor de custo</label>
                              <input
                                type="number"
                                required
                                min="0"
                                value={product.manualCost ? product.manualCost : ''}
                                onChange={e => handleProductChange(index, 'manualCost', e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Valor de custo"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {index === formData.items.length - 1 ? (
                          <button
                            type="button"
                            onClick={handleAddProduct}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Produto
                          </button>
                        ) : <span />}
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 bg-white sticky bottom-0 z-10 border-t mt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                >
                  {editingReceipt ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Confirmar exclusão</h3>
            <p className="mb-6">Tem certeza que deseja excluir este recibo?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >Cancelar</button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
              >Excluir</button>
            </div>
          </div>
        </div>
      )}
      {showImeiModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4">IMEI do Produto</h3>
            <p className="mb-6 break-all">{imeiToShow}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowImeiModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
              >Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Receipts;