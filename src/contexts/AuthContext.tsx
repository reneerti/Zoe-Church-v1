import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Tipos de role do sistema
export type UserRole = 'super_user' | 'master' | 'usuario' | null;

interface UserProfile {
  id: string;
  role: UserRole;
  unidadeId: string | null;
  unidadeSlug: string | null;
  unidadeNome: string | null;
  nome: string | null;
  email: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  role: UserRole;
  isSuperUser: boolean;
  isMaster: boolean;
  isUsuario: boolean;
  unidadeId: string | null;
  unidadeSlug: string | null;
  unidadeNome: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Função para buscar o perfil e role do usuário
  const fetchUserProfile = async (userId: string, email: string): Promise<UserProfile | null> => {
    try {
      // 1. Verificar se é Super User (tabela super_users)
      const { data: superUser } = await supabase
        .from('super_users')
        .select('id, nome, email')
        .eq('email', email)
        .single();

      if (superUser) {
        // Atualizar user_id se ainda não está vinculado
        if (!superUser.id) {
          await supabase
            .from('super_users')
            .update({ user_id: userId })
            .eq('email', email);
        }

        return {
          id: superUser.id,
          role: 'super_user',
          unidadeId: null,
          unidadeSlug: null,
          unidadeNome: null,
          nome: superUser.nome,
          email: superUser.email,
        };
      }

      // 2. Verificar se é Master
      const { data: master } = await supabase
        .from('masters')
        .select(`
          id, nome, email, unidade_id,
          unidades:unidade_id (slug, apelido_app, nome_fantasia)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (master) {
        const unidade = master.unidades as unknown as { slug: string; apelido_app: string | null; nome_fantasia: string } | null;
        return {
          id: master.id,
          role: 'master',
          unidadeId: master.unidade_id,
          unidadeSlug: unidade?.slug || null,
          unidadeNome: unidade?.apelido_app || unidade?.nome_fantasia || null,
          nome: master.nome,
          email: master.email,
        };
      }

      // 3. Verificar se é Usuário (membro)
      const { data: usuario } = await supabase
        .from('usuarios')
        .select(`
          id, nome, email, unidade_id,
          unidades:unidade_id (slug, apelido_app, nome_fantasia)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (usuario) {
        const unidade = usuario.unidades as unknown as { slug: string; apelido_app: string | null; nome_fantasia: string } | null;
        return {
          id: usuario.id,
          role: 'usuario',
          unidadeId: usuario.unidade_id,
          unidadeSlug: unidade?.slug || null,
          unidadeNome: unidade?.apelido_app || unidade?.nome_fantasia || null,
          nome: usuario.nome,
          email: usuario.email,
        };
      }

      // 4. Usuário não tem role ainda (pode ser novo ou aguardando convite)
      return {
        id: '',
        role: null,
        unidadeId: null,
        unidadeSlug: null,
        unidadeNome: null,
        nome: null,
        email: email,
      };
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.email) {
      const userProfile = await fetchUserProfile(user.id, user.email);
      setProfile(userProfile);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user?.email) {
          // Usar setTimeout para evitar deadlock com Supabase
          setTimeout(async () => {
            const userProfile = await fetchUserProfile(session.user.id, session.user.email!);
            setProfile(userProfile);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.email) {
        const userProfile = await fetchUserProfile(session.user.id, session.user.email);
        setProfile(userProfile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  // Computed values
  const role = profile?.role ?? null;
  const isSuperUser = role === 'super_user';
  const isMaster = role === 'master';
  const isUsuario = role === 'usuario';
  const unidadeId = profile?.unidadeId ?? null;
  const unidadeSlug = profile?.unidadeSlug ?? null;
  const unidadeNome = profile?.unidadeNome ?? null;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        loading, 
        profile,
        role,
        isSuperUser,
        isMaster,
        isUsuario,
        unidadeId,
        unidadeSlug,
        unidadeNome,
        signUp, 
        signIn, 
        signInWithGoogle, 
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
