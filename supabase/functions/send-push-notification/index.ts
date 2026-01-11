import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationPayload {
  token?: string;
  tokens?: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firebaseServerKey = Deno.env.get("FIREBASE_SERVER_KEY");
    
    if (!firebaseServerKey) {
      console.error("FIREBASE_SERVER_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Firebase not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: PushNotificationPayload = await req.json();
    const { token, tokens, title, body, data, imageUrl } = payload;

    // Prepare the list of tokens to send to
    const targetTokens = tokens || (token ? [token] : []);
    
    if (targetTokens.length === 0) {
      return new Response(
        JSON.stringify({ error: "No FCM tokens provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notifications to all tokens
    const results = await Promise.all(
      targetTokens.map(async (fcmToken) => {
        try {
          const message = {
            to: fcmToken,
            notification: {
              title,
              body,
              icon: "/favicon.ico",
              click_action: data?.url || "/",
              ...(imageUrl && { image: imageUrl }),
            },
            data: {
              ...data,
              title,
              body,
              url: data?.url || "/",
            },
            // Android specific
            android: {
              priority: "high",
              notification: {
                sound: "default",
                click_action: "OPEN_APP",
              },
            },
            // iOS specific
            apns: {
              payload: {
                aps: {
                  sound: "default",
                  badge: 1,
                },
              },
            },
          };

          const response = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `key=${firebaseServerKey}`,
            },
            body: JSON.stringify(message),
          });

          const result = await response.json();
          console.log("FCM response for token:", fcmToken.substring(0, 20) + "...", result);
          
          return { token: fcmToken, success: response.ok, result };
        } catch (error) {
          console.error("Error sending to token:", fcmToken.substring(0, 20) + "...", error);
          return { token: fcmToken, success: false, error: String(error) };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Sent ${successCount} notifications, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failureCount,
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
