import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import type { User as AuthUser } from '@supabase/supabase-js';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  authUser: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserPreferences: (userId: string, preferences: User['preferences']) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        fetchUser(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        fetchUser(session.user.id);
      } else {
        setAuthUser(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUser = async (userId: string) => {
    try {
      console.log('Buscando usuário com ID:', userId);
      
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
        console.error('Erro ao buscar usuário:', error);
        // Se o usuário não existir na tabela users, vamos criá-lo
        if (error.code === 'PGRST116') {
          const authUserData = await supabase.auth.getUser();
          if (authUserData.data.user) {
            const newUser = {
              id: userId,
              email: authUserData.data.user.email!,
              name: authUserData.data.user.email!.split('@')[0],
              role: 'admin',
              preferences: {}
            };
            
            const { data: insertedUser, error: insertError } = await supabase
              .from('users')
              .insert([newUser])
              .select()
              .single();

            if (insertError) {
              console.error('Erro ao criar usuário:', insertError);
              return;
            }

            setUser(insertedUser);
            return;
          }
        }
      return;
    }

    if (data) {
        console.log('Usuário encontrado:', data);
      setUser(data);
      }
    } catch (error) {
      console.error('Erro geral ao buscar usuário:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando fazer login...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Erro no signIn:', signInError);
        throw signInError;
      }

      console.log('Login bem sucedido:', data);
      
      if (data.user) {
        setAuthUser(data.user);
        await fetchUser(data.user.id);
      }
    } catch (error) {
      console.error('Erro geral no login:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
    const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAuthUser(null);
    setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const updateUserPreferences = async (userId: string, preferences: User['preferences']) => {
    try {
    const { error } = await supabase
      .from('users')
      .update({ preferences })
      .eq('id', userId);

      if (error) throw error;

    if (user?.id === userId) {
      setUser((prev) => (prev ? { ...prev, preferences } : null));
      }
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        signIn,
        signOut,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}