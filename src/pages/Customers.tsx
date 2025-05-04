import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Search, UserPlus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, searchCustomers } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    cpf: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredCustomers = searchQuery ? searchCustomers(searchQuery) : customers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.fullName.trim()) {
        toast.error('O nome do cliente é obrigatório');
        return;
      }

      if (formData.email && !formData.email.includes('@')) {
        toast.error('Email inválido');
        return;
      }

      // Validação do formato do CPF
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (formData.cpf && !cpfRegex.test(formData.cpf)) {
        toast.error('CPF deve estar no formato XXX.XXX.XXX-XX');
        return;
      }

      const customerData = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone?.trim() || null,
        cpf: formData.cpf.trim() || null
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer, customerData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await addCustomer(customerData);
        toast.success('Cliente adicionado com sucesso!');
      }
      
      setShowAddModal(false);
      setEditingCustomer(null);
      setFormData({ fullName: '', email: '', phone: '', cpf: '' });
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar cliente');
    }
  };

  const handleEdit = (customer: typeof customers[0]) => {
    setFormData({
      fullName: customer.full_name,
      email: customer.email || '',
      phone: customer.phone || '',
      cpf: customer.cpf || ''
    });
    setEditingCustomer(customer.id);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    setCustomerToDelete(id);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      await deleteCustomer(customerToDelete);
      toast.success('Cliente excluído com sucesso!');
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (error) {
      if (error instanceof Error && error.message.includes('recibos associados')) {
        setDeleteError('Não é possível excluir este cliente pois existem recibos associados a ele. Exclua primeiro os recibos deste cliente.');
      } else {
        setDeleteError('Erro ao excluir cliente. Por favor, tente novamente.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => {
            setFormData({ fullName: '', email: '', phone: '', cpf: '' });
            setEditingCustomer(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <UserPlus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-md">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border-none focus:ring-0 text-sm"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.cpf}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CPF</label>
                <input
                  type="text"
                  placeholder="XXX.XXX.XXX-XX"
                  value={formData.cpf}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Remove caracteres não numéricos
                    value = value.replace(/\D/g, '');
                    // Aplica a máscara
                    if (value.length <= 11) {
                      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                    }
                    setFormData({ ...formData, cpf: value });
                  }}
                  maxLength={14}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                >
                  {editingCustomer ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmar exclusão</h3>
            <p className="mb-4">Tem certeza que deseja excluir este cliente?</p>
            {deleteError && <p className="text-red-600 mb-4">{deleteError}</p>}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => { setShowDeleteModal(false); setCustomerToDelete(null); setDeleteError(null); }}
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
    </div>
  );
}

export default Customers;