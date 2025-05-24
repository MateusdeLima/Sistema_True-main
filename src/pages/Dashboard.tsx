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
  const { generateReport, customers, products, getExpiringWarranties } = useData();
  const [expiringWarranties, setExpiringWarranties] = useState<Awaited<ReturnType<typeof getExpiringWarranties>>>([]);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const fetchReport = async () => {
      const data = await generateReport(startDate, endDate);
      setReport(data);
    };
    fetchReport();
  }, [startDate, endDate, generateReport]);

  useEffect(() => {
    const loadWarranties = async () => {
      const warranties = await getExpiringWarranties(14);
      setExpiringWarranties(warranties);
    };
    loadWarranties();
  }, [getExpiringWarranties]);

  if (!report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando dados...</div>
      </div>
    );
  }

  const paymentMethodData = {
    labels: Object.keys(report.paymentMethodTotals),
    datasets: [
      {
        data: Object.values(report.paymentMethodTotals),
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
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Início</h1>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quantidade de Vendas</p>
              <p className="text-2xl font-semibold text-gray-900">{typeof report.totalReceipts === 'number' ? report.totalReceipts : 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendas</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(Number(report.totalAmount ?? 0))}</p>
            </div>
            <BarChart2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Custo Total</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(Number(report.totalCost ?? 0))}</p>
            </div>
            <Package className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lucro Total</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(Number(report.totalProfit ?? 0))}</p>
            </div>
            <BarChart2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(Number(report.totalNetProfit ?? 0))}</p>
              <p className="text-xs text-gray-500 mt-1">Lucro líquido descontando taxas de cartão/débito.</p>
            </div>
            <BarChart2 className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Média de Garantia</p>
              <p className="text-2xl font-semibold text-gray-900">{Number(report.averageWarrantyMonths ?? 0).toFixed(1)} meses</p>
            </div>
            <Receipt className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Forma de Pagamento</h2>
          <div className="h-64">
            <Pie data={paymentMethodData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Vendas</h2>
          <div className="space-y-4">
            {report.paymentMethodTotals && typeof report.paymentMethodTotals === 'object' &&
              Object.entries(report.paymentMethodTotals).map(([method, total]) => (
                <div key={method} className="flex justify-between items-center">
                  <span className="text-gray-600">{method}</span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhamento por Forma de Pagamento</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Forma de Pagamento
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % do Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.paymentMethodTotals && typeof report.paymentMethodTotals === 'object' &&
                Object.entries(report.paymentMethodTotals).map(([method, total]) => (
                  <tr key={method}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(Number(total))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {((Number(total) / (Number(report.totalAmount ?? 0) || 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
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
                      {customer.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {daysRemaining} dias
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.warranty_expires_at ? new Date(receipt.warranty_expires_at).toLocaleDateString('pt-BR') : '-'}
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