import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/notifications';
import { BarChart2, Users, Package, Receipt, AlertTriangle } from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

function Dashboard() {
  const { receipts, customers, products, getExpiringWarranties } = useData();
  const [expiringWarranties, setExpiringWarranties] = useState<Awaited<ReturnType<typeof getExpiringWarranties>>>([]);

  useEffect(() => {
    const loadWarranties = async () => {
      const warranties = await getExpiringWarranties(14);
      setExpiringWarranties(warranties);
    };
    loadWarranties();
  }, [getExpiringWarranties]);

  const activeReceipts = receipts;
  const activeCustomers = customers;
  const activeProducts = products;

  const last30DaysReceipts = activeReceipts.filter(r => {
    const date = new Date(r.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  });

  const totalRevenue = last30DaysReceipts.reduce((acc, r) => acc + r.total_amount, 0);

  // Calculate payment method totals
  const paymentMethodTotals = last30DaysReceipts.reduce((acc, receipt) => {
    acc[receipt.payment_method] = (acc[receipt.payment_method] || 0) + receipt.total_amount;
    return acc;
  }, {} as Record<string, number>);

  const paymentMethodData = {
    labels: Object.keys(paymentMethodTotals),
    datasets: [
      {
        data: Object.values(paymentMethodTotals),
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(16, 185, 129, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(239, 68, 68, 0.5)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendas (30 dias)</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <BarChart2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-2xl font-semibold text-gray-900">{activeCustomers.length}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Produtos</p>
              <p className="text-2xl font-semibold text-gray-900">{activeProducts.length}</p>
            </div>
            <Package className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recibos</p>
              <p className="text-2xl font-semibold text-gray-900">{activeReceipts.length}</p>
            </div>
            <Receipt className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Forma de Pagamento</h2>
          <div className="h-64">
            <Pie data={paymentMethodData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Vendas</h2>
          <div className="space-y-4">
            {Object.entries(paymentMethodTotals).map(([method, total]) => (
              <div key={method} className="flex justify-between items-center">
                <span className="text-gray-600">{method}</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {expiringWarranties.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">Garantias Próximas do Vencimento</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dias Restantes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Vencimento
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expiringWarranties.map(({ customer, receipt, daysRemaining }) => (
                  <tr key={receipt.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {daysRemaining} dias
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.warranty?.expiresAt ? new Date(receipt.warranty.expiresAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;