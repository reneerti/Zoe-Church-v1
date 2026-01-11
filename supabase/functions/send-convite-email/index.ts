import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConviteEmailRequest {
  conviteId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { conviteId }: ConviteEmailRequest = await req.json();

    // Buscar dados do convite
    const { data: convite, error: conviteError } = await supabase
      .from("convites")
      .select(`
        *,
        unidades:unidade_id (nome_fantasia, apelido_app, logo_url)
      `)
      .eq("id", conviteId)
      .single();

    if (conviteError || !convite) {
      throw new Error("Convite não encontrado");
    }

    const unidade = convite.unidades as any;
    const conviteLink = `${Deno.env.get("SITE_URL") || "https://preview--allfhenlhsjkuatczato.lovable.app"}/convite/${convite.codigo}`;

    // Template de email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite - ${unidade.apelido_app}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              ${unidade.logo_url ? `<img src="${unidade.logo_url}" alt="${unidade.apelido_app}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 16px;">` : ''}
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                Você foi convidado!
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
                ${unidade.nome_fantasia}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá <strong>${convite.nome}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Você foi convidado(a) para ${convite.tipo === 'master' 
                  ? `ser <strong>${convite.cargo || 'Administrador'}</strong> no` 
                  : 'participar do'} 
                aplicativo <strong>${unidade.apelido_app}</strong>.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Clique no botão abaixo para aceitar o convite e começar sua jornada espiritual:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${conviteLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                      Aceitar Convite
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px; background-color: #f9fafb; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                      <strong>Código do convite:</strong> ${convite.codigo}
                    </p>
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                      <strong>Válido até:</strong> ${new Date(convite.expira_em).toLocaleDateString('pt-BR')}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                Se você não esperava este convite, pode ignorar este email com segurança.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este é um email automático enviado por ${unidade.apelido_app}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: `${unidade.apelido_app} <onboarding@resend.dev>`,
      to: [convite.email],
      subject: `Você foi convidado para ${unidade.apelido_app}`,
      html: emailHtml,
    });

    console.log("Email enviado:", emailResponse);

    // Atualizar status do convite
    await supabase
      .from("convites")
      .update({ 
        email_enviado: true, 
        email_enviado_em: new Date().toISOString() 
      })
      .eq("id", conviteId);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erro ao enviar email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
