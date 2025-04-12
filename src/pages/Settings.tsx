import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function Settings() {
  const { user, updateUserPreferences } = useAuth();

  const handlePreferencesUpdate = (preferences: typeof user.preferences) => {
    if (!user) return;
    try {
      updateUserPreferences(user.id, preferences);
      toast.success('Preferências atualizadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar preferências');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      </div>

      {user && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Preferências do Usuário
          </h2>
          <div className="space-y-4">
            {/* Seletor de Tema */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Tema</label>
              <select
                value={user.preferences?.theme || 'light'}
                onChange={(e) =>
                  handlePreferencesUpdate({
                    ...user.preferences,
                    theme: e.target.value as 'light' | 'dark',
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </div>

            {/* Seletor de Idioma */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Idioma</label>
              <select
                value={user.preferences?.language || 'pt-BR'}
                onChange={(e) =>
                  handlePreferencesUpdate({
                    ...user.preferences,
                    language: e.target.value as 'pt-BR' | 'en',
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;