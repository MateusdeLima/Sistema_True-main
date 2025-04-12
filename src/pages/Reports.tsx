import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils/notifications';
import { generateExcelReport } from '../utils/excel';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

function Reports() {
  const { generateReport } = useData();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<Awaited<ReturnType<typeof generateReport>> | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await generateReport(startDate, endDate);
        setReport(data);
      } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        toast.error('Erro ao gerar relatório');
      }
    };

    fetchReport();
  }, [startDate, endDate, generateReport]);

  const handleExportExcel = () => {
    if (!report) return;

    try {
      const workbook = generateExcelReport(report);
      XLSX.writeFile(workbook, `relatorio-${report.period}.xlsx`);
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    }
  };

  if (!report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex gap-4 mb-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total de Recibos</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {report.totalReceipts}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Valor Total</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatCurrency(report.totalAmount)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Média de Garantia</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {report.averageWarrantyMonths?.toFixed(1) || '0.0'} meses
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Período</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {report.period}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detalhamento por Forma de Pagamento
          </h3>
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
                {Object.entries(report.paymentMethodTotals).map(([method, total]) => (
                  <tr key={method}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {((total / (report.totalAmount || 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;