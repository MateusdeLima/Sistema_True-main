import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function sendEmail(to: string, subject: string, body: string) {
  // Simulated email sending
  console.log(`Sending email to ${to}:`, { subject, body });
  return Promise.resolve();
}

export async function sendWhatsApp(to: string, message: string) {
  // Simulated WhatsApp message sending
  console.log(`Sending WhatsApp message to ${to}:`, message);
  return Promise.resolve();
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}