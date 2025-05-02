import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate } from './notifications';
import type { Database } from '../types/database.types';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

type Receipt = Database['public']['Tables']['receipts']['Row'];

const COMPANY_INFO = {
  name: 'True Iphones',
  cnpj: '45.272.057/0001-88',
  address: 'Rua Bom Pastor – N°2224 / Ipiranga',
  city: 'São Paulo - SP',
  phone: '(11) 97851-3496',
};

// Função auxiliar para carregar o termo de garantia
async function loadWarrantyPdf() {
  try {
    const response = await fetch('/documentos/TERMO DE GARANTIA.pdf');
    if (!response.ok) {
      throw new Error('Arquivo não encontrado');
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Erro ao carregar termo de garantia:', error);
    throw new Error('Não foi possível carregar o termo de garantia. Verifique se o arquivo existe na pasta public/documentos.');
  }
}

// Função para carregar a imagem do logo
async function loadLogoImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const tryLoadImage = (paths: string[]) => {
      if (paths.length === 0) {
        reject(new Error('Não foi possível carregar a imagem do logo em nenhum dos caminhos tentados'));
        return;
      }

      const currentPath = paths[0];
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => resolve(img);
      
      img.onerror = () => {
        console.log(`Tentativa falhou para: ${currentPath}, tentando próximo caminho...`);
        tryLoadImage(paths.slice(1));
      };
      
      img.src = currentPath;
    };

    // Lista de possíveis caminhos para a imagem
    const possiblePaths = [
      '/imagem/logo.png',
      '/logo.png',
      '/logo.jpg',
      '/imagem/logo.jpg',
      '/images/logo.jpg',
      '/PHOTO-2024-07-03-16-44-10.jpg',
      '/imagem/PHOTO-2024-07-03-16-44-10.jpg'
    ];

    tryLoadImage(possiblePaths);
  });
}

function getNextReceiptNumber() {
  let lastReceiptNumber = localStorage.getItem('lastReceiptNumber');
  if (!lastReceiptNumber) {
    lastReceiptNumber = '0';
  }
  const nextReceiptNumber = parseInt(lastReceiptNumber, 10) + 1;
  localStorage.setItem('lastReceiptNumber', nextReceiptNumber.toString());
  return nextReceiptNumber;
}

// Função para gerar recibo sem imagem
function generateBasicReceipt(doc: jsPDF, receipt: Receipt, customerName: string, customerCpf: string | null, products: Array<{ name: string; quantity: number; price: number; imei?: string }>, employeeName: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Definir margens ABNT
  const marginLeft = 3; // 3cm margem esquerda
  const marginRight = 2; // 2cm margem direita
  const marginTop = 2; // 2cm margem superior
  const marginBottom = 2; // 2cm margem inferior

  let startY = marginTop;

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('TRUE IPHONES', pageWidth / 2, startY, { align: 'center' });

  startY += 1;
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  doc.text(`CNPJ: ${COMPANY_INFO.cnpj}`, pageWidth / 2, startY, { align: 'center' });
  doc.text(COMPANY_INFO.address, pageWidth / 2, startY + 0.3, { align: 'center' });
  doc.text(COMPANY_INFO.city, pageWidth / 2, startY + 0.6, { align: 'center' });
  doc.text(`Telefone: ${COMPANY_INFO.phone}`, pageWidth / 2, startY + 0.9, { align: 'center' });

  startY += 1.5;
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text('Recibo de Venda', pageWidth / 2, startY, { align: 'center' });

  startY += 0.8;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Cliente: ${customerName}`, marginLeft, startY);
  if (customerCpf) {
    startY += 0.4;
    doc.text(`CPF: ${customerCpf}`, marginLeft, startY);
  }
  startY += 0.6;
  doc.text(`Data: ${formatDate(receipt.created_at)}`, marginLeft, startY);
  startY += 0.4;
  doc.text(`Recibo Nº: ${getNextReceiptNumber()}`, marginLeft, startY);
  startY += 0.4;
  doc.text(`Vendedor: ${employeeName}`, marginLeft, startY);

  startY += 0.8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  // Ajustar posições das colunas considerando as margens
  const colItem = marginLeft;
  const colIMEI = marginLeft + 5;
  const colQtd = marginLeft + 9;
  const colPreco = marginLeft + 11;
  const colTotal = marginLeft + 13.5;

  doc.text('Item', colItem, startY);
  doc.text('IMEI', colIMEI, startY);
  doc.text('Qtd', colQtd, startY);
  doc.text('Preço', colPreco, startY);
  doc.text('Total', colTotal, startY);

  startY += 0.5;
  doc.setFont('helvetica', 'normal');
  products.forEach((item) => {
    doc.text(item.name, colItem, startY);
    if (item.imei) {
      doc.text(item.imei, colIMEI, startY);
    }
    doc.text(item.quantity.toString(), colQtd, startY);
    doc.text(formatCurrency(item.price), colPreco, startY);
    doc.text(formatCurrency(item.price * item.quantity), colTotal, startY);
    startY += 0.5;
  });

  startY += 0.5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Forma de Pagamento: ${receipt.payment_method}`, marginLeft, startY);
  startY += 0.5;
  if (receipt.installments > 1) {
    doc.text(
      `Parcelamento: ${receipt.installments}x de ${formatCurrency(receipt.installment_value)}`,
      marginLeft,
      startY
    );
    startY += 0.5;
  }

  if (receipt.warranty_duration_months) {
    startY += 0.8;
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 102);
    doc.text('Informações da Garantia', pageWidth / 2, startY, { align: 'center' });
    startY += 0.5;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Duração: ${receipt.warranty_duration_months} meses`, marginLeft, startY);
    startY += 0.5;
    if (receipt.warranty_expires_at) {
      doc.text(`Válida até: ${formatDate(receipt.warranty_expires_at)}`, marginLeft, startY);
    }
  }

  startY += 1.5;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  // Ajustar posições das assinaturas considerando as margens
  const centerVendedor = marginLeft + 4;
  const centerCliente = pageWidth - marginRight - 4;
  const lineWidth = 4;

  doc.setFont('helvetica', 'italic');
  doc.text('True Iphones', centerVendedor, startY - 0.3, { align: 'center' });
  doc.line(centerVendedor - lineWidth / 2, startY, centerVendedor + lineWidth / 2, startY);
  doc.setFont('helvetica', 'normal');
  doc.text('Assinatura do Vendedor', centerVendedor, startY + 0.5, { align: 'center' });

  doc.line(centerCliente - lineWidth / 2, startY, centerCliente + lineWidth / 2, startY);
  doc.text('Assinatura do Cliente', centerCliente, startY + 0.5, { align: 'center' });

  startY += 1.5;
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text('Obrigado por escolher a True Iphones!', pageWidth / 2, startY, { align: 'center' });
  doc.text('Para dúvidas, entre em contato: (11) 97851-3496', pageWidth / 2, startY + 0.5, { align: 'center' });

  return startY + 1; // Retorna a última posição Y usada
}

export async function generateReceiptPDF(
  receipt: Receipt,
  customerName: string,
  customerCpf: string | null,
  products: Array<{ name: string; quantity: number; price: number; imei?: string }>,
  employeeName: string
) {
  // Gerar o recibo com margens ABNT
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'cm',
    format: 'a4'
  });
  
  // Definir margens manualmente
  const marginLeft = 3; // 3cm margem esquerda
  const marginRight = 2; // 2cm margem direita
  const marginTop = 2; // 2cm margem superior
  const marginBottom = 2; // 2cm margem inferior
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let startY = 0;

  try {
    // Tentar carregar a imagem do logo
    const logoImage = await loadLogoImage();

    // Adicionar marca d'água
    const watermarkWidth = pageWidth - (marginLeft + marginRight);
    const watermarkHeight = (logoImage.height * watermarkWidth) / logoImage.width;
    
    // Configurar opacidade para marca d'água
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    
    // Adicionar marca d'água centralizada
    const watermarkX = marginLeft;
    const watermarkY = (pageHeight - watermarkHeight) / 2;
    doc.addImage(logoImage, 'PNG', watermarkX, watermarkY, watermarkWidth, watermarkHeight);
    
    // Restaurar opacidade para o logo principal
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Adicionar logo no topo - reduzido e mais próximo do conteúdo
    const logoWidth = 4; // 4cm
    const logoHeight = (logoImage.height * logoWidth) / logoImage.width;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logoImage, 'PNG', logoX, marginTop, logoWidth, logoHeight);

    startY = marginTop + logoHeight + 0.5;

    // Continuar com o resto do recibo com espaçamentos reduzidos
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text(`CNPJ: ${COMPANY_INFO.cnpj}`, pageWidth / 2, startY, { align: 'center' });
    doc.text(COMPANY_INFO.address, pageWidth / 2, startY + 0.3, { align: 'center' });
    doc.text(COMPANY_INFO.city, pageWidth / 2, startY + 0.6, { align: 'center' });
    doc.text(`Telefone: ${COMPANY_INFO.phone}`, pageWidth / 2, startY + 0.9, { align: 'center' });

    startY += 1.5;
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('Recibo de Venda', pageWidth / 2, startY, { align: 'center' });

    startY += 0.8;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cliente: ${customerName}`, marginLeft, startY);
    if (customerCpf) {
      startY += 0.4;
      doc.text(`CPF: ${customerCpf}`, marginLeft, startY);
    }
    startY += 0.6;
    doc.text(`Data: ${formatDate(receipt.created_at)}`, marginLeft, startY);
    startY += 0.4;
    doc.text(`Recibo Nº: ${getNextReceiptNumber()}`, marginLeft, startY);
    startY += 0.4;
    doc.text(`Vendedor: ${employeeName}`, marginLeft, startY);

    startY += 0.8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    // Ajustar posições das colunas considerando as margens
    const colItem = marginLeft;
    const colIMEI = marginLeft + 5;
    const colQtd = marginLeft + 9;
    const colPreco = marginLeft + 11;
    const colTotal = marginLeft + 13.5;

    doc.text('Item', colItem, startY);
    doc.text('IMEI', colIMEI, startY);
    doc.text('Qtd', colQtd, startY);
    doc.text('Preço', colPreco, startY);
    doc.text('Total', colTotal, startY);

    startY += 0.5;
    doc.setFont('helvetica', 'normal');
    products.forEach((item) => {
      doc.text(item.name, colItem, startY);
      if (item.imei) {
        doc.text(item.imei, colIMEI, startY);
      }
      doc.text(item.quantity.toString(), colQtd, startY);
      doc.text(formatCurrency(item.price), colPreco, startY);
      doc.text(formatCurrency(item.price * item.quantity), colTotal, startY);
      startY += 0.5;
    });

    startY += 0.5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Forma de Pagamento: ${receipt.payment_method}`, marginLeft, startY);
    startY += 0.5;
    if (receipt.installments > 1) {
      doc.text(
        `Parcelamento: ${receipt.installments}x de ${formatCurrency(receipt.installment_value)}`,
        marginLeft,
        startY
      );
      startY += 0.5;
    }

    if (receipt.warranty_duration_months) {
      startY += 0.8;
      doc.setFontSize(12);
      doc.setTextColor(0, 51, 102);
      doc.text('Informações da Garantia', pageWidth / 2, startY, { align: 'center' });
      startY += 0.5;
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Duração: ${receipt.warranty_duration_months} meses`, marginLeft, startY);
      startY += 0.5;
      if (receipt.warranty_expires_at) {
        doc.text(`Válida até: ${formatDate(receipt.warranty_expires_at)}`, marginLeft, startY);
      }
    }

    startY += 1.5;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    // Ajustar posições das assinaturas considerando as margens
    const centerVendedor = marginLeft + 4;
    const centerCliente = pageWidth - marginRight - 4;
    const lineWidth = 4;

    doc.setFont('helvetica', 'italic');
    doc.text('True Iphones', centerVendedor, startY - 0.3, { align: 'center' });
    doc.line(centerVendedor - lineWidth / 2, startY, centerVendedor + lineWidth / 2, startY);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do Vendedor', centerVendedor, startY + 0.5, { align: 'center' });

    doc.line(centerCliente - lineWidth / 2, startY, centerCliente + lineWidth / 2, startY);
    doc.text('Assinatura do Cliente', centerCliente, startY + 0.5, { align: 'center' });

    startY += 1.5;
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text('Obrigado por escolher a True Iphones!', pageWidth / 2, startY, { align: 'center' });
    doc.text('Para dúvidas, entre em contato: (11) 97851-3496', pageWidth / 2, startY + 0.5, { align: 'center' });

  } catch (error) {
    console.error('Erro ao adicionar imagens ao PDF:', error);
    // Se falhar ao carregar a imagem, gerar recibo sem ela
    startY = generateBasicReceipt(doc, receipt, customerName, customerCpf, products, employeeName);
  }

  // Converter o recibo para PDF-lib
  const receiptPdfBytes = doc.output('arraybuffer');
  const pdfDoc = await PDFDocument.create();
  
  // Adicionar página do recibo
  const receiptPages = await pdfDoc.copyPages(
    await PDFDocument.load(receiptPdfBytes),
    [0]
  );
  pdfDoc.addPage(receiptPages[0]);

  // Adicionar o termo de garantia
  try {
    const warrantyBytes = await loadWarrantyPdf();
    const warrantyDoc = await PDFDocument.load(warrantyBytes);
    const warrantyPages = await pdfDoc.copyPages(warrantyDoc, warrantyDoc.getPageIndices());
    warrantyPages.forEach(page => pdfDoc.addPage(page));
  } catch (error) {
    console.error('Erro ao adicionar termo de garantia:', error);
    throw new Error('Não foi possível adicionar o termo de garantia ao recibo. Verifique se o arquivo existe na pasta public/documentos.');
  }

  // Retornar o documento combinado
  const combinedPdfBytes = await pdfDoc.save();
  const blob = new Blob([combinedPdfBytes], { type: 'application/pdf' });
  return blob;
}