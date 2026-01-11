import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, X } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Verifica se o navegador suporta notificações
const supportsNotifications = 'Notification' in window;
const supportsServiceWorker = 'serviceWorker' in navigator;

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    supportsNotifications ? Notification.permission : 'denied'
  );
  const [isSupported, setIsSupported] = useState(false);
  
  useEffect(() => {
    setIsSupported(supportsNotifications && supportsServiceWorker);
    if (supportsNotifications) {
      setPermission(Notification.permission);
    }
  }, []);
  
  const requestPermission = async () => {
    if (!supportsNotifications) {
      toast.error('Seu navegador não suporta notificações');
      return false;
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notificações ativadas!');
        return true;
      } else if (result === 'denied') {
        toast.error('Notificações bloqueadas. Verifique as configurações do navegador.');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao ativar notificações');
      return false;
    }
  };
  
  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;
    
    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options?.data?.url) {
          window.location.href = options.data.url;
        }
      };
      
      return notification;
    } catch (error) {
      console.error('Erro ao exibir notificação:', error);
    }
  };
  
  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    isEnabled: permission === 'granted',
  };
}

// Componente de banner para solicitar permissão
export function PushNotificationBanner() {
  const { user } = useAuth();
  const { permission, isSupported, requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    const isDismissed = localStorage.getItem('push_banner_dismissed');
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);
  
  if (!user || !isSupported || permission !== 'default' || dismissed) {
    return null;
  }
  
  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('push_banner_dismissed', 'true');
  };
  
  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      handleDismiss();
    }
  };
  
  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 p-4 bg-primary text-primary-foreground animate-slide-up max-w-lg mx-auto">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-primary-foreground/10 rounded"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
          <Bell className="h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Ativar notificações</h3>
          <p className="text-sm opacity-90 mb-3">
            Receba lembretes de leitura e avisos importantes da sua igreja.
          </p>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={handleEnable}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <Bell className="h-4 w-4 mr-1" />
              Ativar
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={handleDismiss}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Hook para ouvir novas notificações em tempo real
export function useNotificationListener() {
  const { user } = useAuth();
  const { showNotification, isEnabled } = usePushNotifications();
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    if (!user) return;
    
    // Buscar contagem inicial de não lidas
    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notificacoes_usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('lida_em', null);
      
      setUnreadCount(count || 0);
    };
    
    fetchUnreadCount();
    
    // Subscrever a novas notificações
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes_usuarios',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Incrementar contador
          setUnreadCount(prev => prev + 1);
          
          // Buscar detalhes da notificação
          const { data } = await supabase
            .from('notificacoes')
            .select('*')
            .eq('id', payload.new.notificacao_id)
            .single();
          
          if (data && isEnabled) {
            // Mostrar notificação do sistema
            showNotification(data.titulo, {
              body: data.mensagem,
              tag: data.id,
              data: { url: data.link_acao || '/notificacoes' },
            });
          }
          
          // Mostrar toast dentro do app
          toast(data?.titulo || 'Nova notificação', {
            description: data?.mensagem,
            action: data?.link_acao ? {
              label: 'Ver',
              onClick: () => window.location.href = data.link_acao,
            } : undefined,
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isEnabled]);
  
  const markAllAsRead = () => {
    setUnreadCount(0);
  };
  
  return { unreadCount, markAllAsRead };
}
