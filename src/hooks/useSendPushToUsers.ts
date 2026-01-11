import { supabase } from '@/integrations/supabase/client';
import { isFirebaseConfigured } from '@/lib/firebase';

interface SendPushOptions {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export const sendPushToUsers = async ({
  userIds,
  title,
  body,
  data,
  imageUrl,
}: SendPushOptions): Promise<{ sent: number; failed: number }> => {
  if (!isFirebaseConfigured()) {
    console.log('Firebase not configured, skipping push notifications');
    return { sent: 0, failed: 0 };
  }

  if (userIds.length === 0) {
    return { sent: 0, failed: 0 };
  }

  try {
    // Fetch FCM tokens for the given user IDs
    const { data: tokens, error: tokensError } = await supabase
      .from('fcm_tokens')
      .select('token')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (tokensError) {
      console.error('Error fetching FCM tokens:', tokensError);
      return { sent: 0, failed: 0 };
    }

    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens found for users');
      return { sent: 0, failed: 0 };
    }

    const tokenList = tokens.map(t => t.token);

    // Call edge function to send push notifications
    const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        tokens: tokenList,
        title,
        body,
        data,
        imageUrl,
      },
    });

    if (error) {
      console.error('Error sending push notifications:', error);
      return { sent: 0, failed: tokenList.length };
    }

    return {
      sent: result?.sent || 0,
      failed: result?.failed || 0,
    };
  } catch (error) {
    console.error('Error in sendPushToUsers:', error);
    return { sent: 0, failed: 0 };
  }
};

export const sendPushToUnidade = async (
  unidadeId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> => {
  try {
    // Fetch all active users from the unidade
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('user_id')
      .eq('unidade_id', unidadeId)
      .eq('is_active', true)
      .not('user_id', 'is', null);

    if (usuariosError) {
      console.error('Error fetching users:', usuariosError);
      return { sent: 0, failed: 0 };
    }

    const userIds = usuarios?.map(u => u.user_id).filter(Boolean) as string[];

    return sendPushToUsers({
      userIds,
      title,
      body,
      data,
    });
  } catch (error) {
    console.error('Error in sendPushToUnidade:', error);
    return { sent: 0, failed: 0 };
  }
};
