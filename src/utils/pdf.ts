import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate } from './notifications';
import type { Database } from '../types/database.types';

type Receipt = Database['public']['Tables']['receipts']['Row'];

const COMPANY_INFO = {
  name: 'True Iphones',
  cnpj: '45.272.057/0001-88',
  address: 'Rua Bom Pastor, 2100 - Ipiranga',
  city: 'São Paulo - SP',
  phone: '(11) 97851-3496',
};

function getNextReceiptNumber() {
  let lastReceiptNumber = localStorage.getItem('lastReceiptNumber');
  if (!lastReceiptNumber) {
    lastReceiptNumber = '0';
  }
  const nextReceiptNumber = parseInt(lastReceiptNumber, 10) + 1;
  localStorage.setItem('lastReceiptNumber', nextReceiptNumber.toString());
  return nextReceiptNumber;
}

export function generateReceiptPDF(
  receipt: Receipt,
  customerName: string,
  products: Array<{ name: string; quantity: number; price: number }>,
  employeeName: string
) {
  const doc = new jsPDF();

  doc.setTextColor(0, 0, 0);

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('TRUE IPHONES', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  doc.text(`CNPJ: ${COMPANY_INFO.cnpj}`, 105, 30, { align: 'center' });
  doc.text(COMPANY_INFO.address, 105, 35, { align: 'center' });
  doc.text(COMPANY_INFO.city, 105, 40, { align: 'center' });
  doc.text(`Telefone: ${COMPANY_INFO.phone}`, 105, 45, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(0, 51, 102);
  doc.text('Recibo de Venda', 105, 60, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Cliente: ${customerName}`, 20, 80);
  doc.text(`Data: ${formatDate(receipt.created_at)}`, 20, 90);
  doc.text(`Recibo Nº: ${getNextReceiptNumber()}`, 20, 100);
  doc.text(`Vendedor: ${employeeName}`, 20, 110);

  let y = 130;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 20, y);
  doc.text('Qtd', 120, y);
  doc.text('Preço', 150, y);
  doc.text('Total', 180, y);

  y += 10;
  doc.setFont('helvetica', 'normal');
  products.forEach((item) => {
    doc.text(item.name, 20, y);
    doc.text(item.quantity.toString(), 120, y);
    doc.text(formatCurrency(item.price), 150, y);
    doc.text(formatCurrency(item.price * item.quantity), 180, y);
    y += 10;
  });

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text(`Forma de Pagamento: ${receipt.payment_method}`, 20, y);
  y += 10;
  if (receipt.installments > 1) {
    doc.text(
      `Parcelamento: ${receipt.installments}x de ${formatCurrency(receipt.installment_value)}`,
      20,
      y
    );
    y += 10;
  }
  doc.text(`Valor Total: ${formatCurrency(receipt.total_amount)}`, 20, y);

  if (receipt.warranty_duration_months) {
    y += 20;
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('Informações da Garantia', 105, y, { align: 'center' });
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Duração: ${receipt.warranty_duration_months} meses`, 20, y);
    y += 10;
    if (receipt.warranty_expires_at) {
      doc.text(`Válida até: ${formatDate(receipt.warranty_expires_at)}`, 20, y);
    }
  }

  y += 30;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  const centerVendedor = 60;
  const centerCliente = 150;
  const lineWidth = 70;

  doc.setFont('helvetica', 'italic');
  doc.text('True Iphones', centerVendedor, y - 5, { align: 'center' });
  doc.line(centerVendedor - lineWidth / 2, y, centerVendedor + lineWidth / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Assinatura do Vendedor', centerVendedor, y + 10, { align: 'center' });

  doc.line(centerCliente - lineWidth / 2, y, centerCliente + lineWidth / 2, y);
  doc.text('Assinatura do Cliente', centerCliente, y + 10, { align: 'center' });

  y += 30;
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  doc.text('Obrigado por escolher a True Iphones!', 105, y, { align: 'center' });
  doc.text('Para dúvidas, entre em contato: (11) 97851-3496', 105, y + 10, { align: 'center' });

  return doc;
}