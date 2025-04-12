import * as XLSX from 'xlsx';
import type { Report } from '../contexts/DataContext';
import { formatCurrency } from './notifications';

export function generateExcelReport(report: Report) {
  const workbook = XLSX.utils.book_new();
  
  // Summary Sheet
  const summaryData = [
    ['Relatório de Vendas'],
    ['Período:', report.period],
    [],
    ['Total de Recibos:', report.totalReceipts],
    ['Valor Total:', formatCurrency(report.totalAmount)],
    ['Média de Meses de Garantia:', report.averageWarrantyMonths.toFixed(1)],
    [],
    ['Vendas por Forma de Pagamento'],
    ['Forma de Pagamento', 'Valor Total'],
    ...Object.entries(report.paymentMethodTotals).map(([method, total]) => [
      method,
      formatCurrency(total),
    ]),
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
  
  // Top Products Sheet
  const productsData = [
    ['Top 10 Produtos Mais Vendidos'],
    ['Produto', 'Quantidade', 'Valor Total'],
    ...report.topProducts.map((product) => [
      product.name,
      product.quantity,
      formatCurrency(product.total),
    ]),
  ];
  
  const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produtos');
  
  return workbook;
}