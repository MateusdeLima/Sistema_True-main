import React, { useState } from 'react';
import { uploadFile, getFileUrl } from '../utils/storage';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onUploadSuccess?: (filePath: string) => void;
  onUploadError?: (error: Error) => void;
  folder?: string;
}

export function FileUpload({ 
  onUploadSuccess, 
  onUploadError,
  folder = 'receipts'
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(selectedFile, folder);
      
      if (result.error) {
        throw result.error;
      }

      const fileUrl = await getFileUrl(result.path, folder);
      
      toast.success('Arquivo enviado com sucesso!');
      onUploadSuccess?.(result.path);
      
      // Limpar seleção
      setSelectedFile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar arquivo';
      toast.error(errorMessage);
      onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-4 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Clique para selecionar</span> ou arraste e solte
            </p>
            <p className="text-xs text-gray-500">PDF (máx. 5MB)</p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">{selectedFile.name}</span>
            <span className="text-xs text-gray-500">
              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Enviando...' : 'Enviar Arquivo'}
      </button>
    </div>
  );
} 