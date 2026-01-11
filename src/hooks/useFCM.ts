import { useState, useEffect, useCallback } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { firebaseConfig, vapidKey, isFirebaseConfigured } from '@/lib/firebase';

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

export function useFCM() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported_, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Firebase
  const initializeFirebase = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      console.log('Firebase not configured');
      setIsLoading(false);
      return false;
    }

    try {
      // Check if messaging is supported
      const supported = await isSupported();
      setIsSupported(supported);
      
      if (!supported) {
        console.log('FCM not supported in this browser');
        setIsLoading(false);
        return false;
      }

      // Initialize app if not already done
      if (getApps().length === 0) {
        firebaseApp = initializeApp(firebaseConfig);
      } else {
        firebaseApp = getApps()[0];
      }

      messaging = getMessaging(firebaseApp);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error initializing Firebase:', err);
      setError(String(err));
      setIsLoading(false);
      return false;
    }
  }, []);

  // Request notification permission and get token
  const requestPermissionAndToken = useCallback(async () => {
    if (!messaging) {
      const initialized = await initializeFirebase();
      if (!initialized || !messaging) {
        return null;
      }
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log('FCM Token obtained:', token.substring(0, 20) + '...');
        setFcmToken(token);
        
        // Save token to database if user is logged in
        if (user) {
          await saveTokenToDatabase(token);
        }
        
        return token;
      }
      
      return null;
    } catch (err) {
      console.error('Error getting FCM token:', err);
      setError(String(err));
      return null;
    }
  }, [user, initializeFirebase]);

  // Save token to database
  const saveTokenToDatabase = async (token: string) => {
    if (!user) return;

    try {
      // Get device info
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      
      // Use raw SQL approach via RPC or direct insert
      const { error: insertError } = await supabase
        .from('fcm_tokens' as any)
        .upsert({
          user_id: user.id,
          token,
          device_info: {
            userAgent,
            platform,
            language: navigator.language,
          },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        });
      
      if (insertError) {
        console.error('Error saving FCM token:', insertError);
      } else {
        console.log('FCM token saved to database');
      }
    } catch (err) {
      console.error('Error saving FCM token:', err);
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show toast notification
      toast(payload.notification?.title || 'Nova notificação', {
        description: payload.notification?.body,
        action: payload.data?.url ? {
          label: 'Ver',
          onClick: () => window.location.href = payload.data?.url || '/',
        } : undefined,
      });
    });

    return () => unsubscribe();
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeFirebase();
  }, [initializeFirebase]);

  // Save token when user changes
  useEffect(() => {
    if (user && fcmToken) {
      saveTokenToDatabase(fcmToken);
    }
  }, [user, fcmToken]);

  return {
    fcmToken,
    isSupported: isSupported_,
    isLoading,
    error,
    requestPermissionAndToken,
    isConfigured: isFirebaseConfigured(),
  };
}

// Hook to send push notifications via edge function
export function useSendPushNotification() {
  const [isSending, setIsSending] = useState(false);

  const sendNotification = async (params: {
    token?: string;
    tokens?: string[];
    userId?: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }) => {
    setIsSending(true);

    try {
      let targetTokens = params.tokens || (params.token ? [params.token] : []);

      // If userId is provided, fetch tokens from database
      if (params.userId && targetTokens.length === 0) {
        const { data: tokenData } = await supabase
          .from('fcm_tokens' as any)
          .select('token')
          .eq('user_id', params.userId);
        
        if (tokenData && Array.isArray(tokenData)) {
          targetTokens = tokenData.map((t: any) => t.token);
        }
      }

      if (targetTokens.length === 0) {
        console.log('No FCM tokens found for user');
        return { success: false, error: 'No tokens found' };
      }

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          tokens: targetTokens,
          title: params.title,
          body: params.body,
          data: params.data,
        },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error sending push notification:', err);
      return { success: false, error: String(err) };
    } finally {
      setIsSending(false);
    }
  };

  return { sendNotification, isSending };
}
