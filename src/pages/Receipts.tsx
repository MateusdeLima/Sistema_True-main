import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Search, PlusCircle, FileText, Trash2, MessageCircle, X, Plus } from 'lucide-react';
import { formatCurrency } from '../utils/notifications';
import { generateReceiptPDF } from '../utils/pdf';
import toast from 'react-hot-toast';
import { Database } from '../types/database.types';

type Receipt = Database['public']['Tables']['receipts']['Row'];
type ReceiptItem = Database['public']['Tables']['receipt_items']['Row'];

interface FormItem {
  productId: string;
  quantity: number;
  price: number;
}

interface PrintableProduct {
  name: string;
  quantity: number;
  price: number;
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

type ProductField = 'productId' | 'quantity' | 'price';

function Receipts() {
  const {
    receipts,
    customers,
    products,
    employees,
    addReceipt,
    deleteReceipt,
    searchProducts,
    getCustomerById,
    getProductById,
    getEmployeeById,
    getReceiptById,
    updateReceipt,
    updateReceiptItemPrice,
  } = useData();

  // Estado inicial do formulário
  const initialFormData: ReceiptFormData = {
    customerId: '',
    employeeId: '',
    items: [{ productId: '', quantity: 1, price: 0 }],
    paymentMethod: 'Dinheiro',
    installments: 1,
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

  useEffect(() => {
    const loadReceiptData = async () => {
      if (editingReceipt) {
        const receiptData = await getReceiptById(editingReceipt.id);
        if (receiptData) {
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
            items: receiptData.items.map(item => ({
              productId: item.product_id,
              quantity: item.quantity,
              price: item.price
            }))
          });
        }
      }
    };

    loadReceiptData();
  }, [editingReceipt, getReceiptById, initialFormData]);

  const calculateTotals = () => {
    const total = formData.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const installmentValue = formData.installments > 0 ? total / formData.installments : total;
    return { total, installmentValue };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { total, installmentValue } = calculateTotals();
      
      const receiptData = {
        customer_id: formData.customerId,
        total_amount: total,
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
        price: item.price
      }));

      if (editingReceipt) {
        await updateReceipt(editingReceipt.id, receiptData);
      } else {
        await addReceipt(receiptData, receiptItems);
      }

      setShowAddModal(false);
      setEditingReceipt(null);
      setFormData(initialFormData);
      toast.success('Recibo salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar recibo:', error);
      toast.error('Erro ao salvar recibo. Verifique se todos os campos obrigatórios foram preenchidos.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este recibo?')) {
      await deleteReceipt(id);
      toast.success('Recibo excluído com sucesso!');
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
    const receiptData = await getReceiptById(receipt.id);
    if (!receiptData) {
      toast.error('Não foi possível encontrar os itens do recibo');
      return;
    }
    const items = receiptData.items;
    const receiptProducts = await Promise.all(items.map(async (item: ReceiptItem) => {
      const product = getProductById(item.product_id);
      if (!product) return null;
      return {
        name: product.name,
        quantity: item.quantity,
        price: item.price,
      };
    }));

    const validProducts = receiptProducts.filter((p): p is PrintableProduct => p !== null);
    const formattedDate = new Date(receipt.created_at).toLocaleDateString('pt-BR');
    const fileName = `recibo ${customer.full_name}-${formattedDate}.pdf`;

    const doc = generateReceiptPDF(receipt, customer.full_name, validProducts, employee.full_name);
    doc.save(fileName);
    toast.success('PDF gerado com sucesso!');
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
        price: selectedProduct ? selectedProduct.default_price : 0
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
      items: [...formData.items, { productId: '', quantity: 1, price: 0 }],
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
                <p className="text-sm">
                  Valor Total: {formatCurrency(receipt.total_amount)}
                </p>
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
                      {receipt.receipt_items.map(item => (
                        <li key={item.id} className="flex items-center gap-2">
                          <span className="flex-1">
                            {item.products?.name || 'Produto'} (Qtd: {item.quantity})
                          </span>
                          {editingItemId === item.id ? (
                            <>
                              <input
                                type="number"
                                className="border rounded px-2 py-1 w-24"
                                value={editingItemPrice}
                                min={0}
                                onChange={e => setEditingItemPrice(Number(e.target.value))}
                              />
                              <button
                                className="text-green-600 font-bold px-2"
                                onClick={() => saveEditItemPrice(item.id)}
                                type="button"
                              >Salvar</button>
                              <button
                                className="text-gray-500 px-2"
                                onClick={() => setEditingItemId(null)}
                                type="button"
                              >Cancelar</button>
                            </>
                          ) : (
                            <>
                              <span className="font-mono">{formatCurrency(item.price)}</span>
                              <button
                                className="text-blue-500 hover:underline ml-2"
                                onClick={() => startEditItemPrice(item.id, item.price)}
                                type="button"
                              >Editar valor</button>
                            </>
                          )}
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Funcionário
                  </label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Selecione um funcionário</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name}
                      </option>
                    ))}
                  </select>
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
                      value={formData.installments}
                      onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) || 1 })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Garantia (meses)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.warranty.durationMonths}
                    onChange={(e) => setFormData({
                      ...formData,
                      warranty: { durationMonths: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Expiração da Garantia
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.warrantyExpiresAt}
                    onChange={(e) => setFormData({ ...formData, warrantyExpiresAt: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produtos
                </label>
                <div className="space-y-4">
                  {formData.items.map((product, index) => (
                    <div key={index} className="flex items-end gap-4">
                      <div className="flex-1">
                        <select
                          required
                          value={product.productId}
                          onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Selecione um produto</option>
                          {filteredProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} - {p.code} - {formatCurrency(p.default_price)}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Buscar produtos..."
                          value={productQuery}
                          onChange={(e) => setProductQuery(e.target.value)}
                          className="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          required
                          min="1"
                          value={product.quantity}
                          onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Quantidade"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(index)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Produto
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-4">
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
    </div>
  );
}

export default Receipts;