import { supabase } from '../lib/supabase';

// Tipos de arquivo permitidos
const ALLOWED_MIME_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB em bytes

// Interface para o resultado do upload
interface UploadResult {
  path: string;
  error: Error | null;
}

// Função para validar o arquivo antes do upload
function validateFile(file: File): void {
  // Validar tipo do arquivo
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Apenas arquivos PDF são permitidos');
  }

  // Validar tamanho do arquivo
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('O arquivo deve ter no máximo 5MB');
  }
}

// Função para gerar um nome único para o arquivo
function generateUniqueFileName(file: File): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
}

// Função principal para upload de arquivo
export async function uploadFile(file: File, folder: string = 'receipts'): Promise<UploadResult> {
  try {
    // Validar arquivo
    validateFile(file);

    // Gerar nome único
    const fileName = generateUniqueFileName(file);

    // Criar caminho completo
    const filePath = `${folder}/${fileName}`;

    // Fazer upload
    const { data, error } = await supabase.storage
      .from(folder)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    return {
      path: data.path,
      error: null
    };
  } catch (error) {
    return {
      path: '',
      error: error instanceof Error ? error : new Error('Erro desconhecido no upload')
    };
  }
}

// Função para obter URL pública do arquivo
export async function getFileUrl(filePath: string, folder: string = 'receipts'): Promise<string> {
  const { data } = supabase.storage
    .from(folder)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Função para deletar arquivo
export async function deleteFile(filePath: string, folder: string = 'receipts'): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(folder)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    return false;
  }
}

// Função para listar arquivos em uma pasta
export async function listFiles(folder: string = 'receipts'): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(folder)
      .list();

    if (error) {
      throw error;
    }

    return data.map(file => file.name);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    return [];
  }
} 