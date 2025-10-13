// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const HOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "no-reply@charcoaldiner.in";

const resend = new Resend(RESEND_API_KEY);

function checkTokenMatch(provided: string | null, secret: string) {
  if (!provided) return false;
  // provided may be "Bearer x" or just "x"
  const token = provided.startsWith("Bearer ") ? provided.slice(7) : provided;

  // allow multiple acceptable shapes:
  // 1) exact secret (v1,whsec_xxx)
  // 2) secret without v1,whsec_ prefix
  // 3) secret without just 'v1,' prefix
  const variations = new Set<string>([
    secret,
    secret.replace(/^v1,whsec_/, ""),
    secret.replace(/^v1,/, ""),
    secret.replace(/^whsec_/, ""),
  ]);
  return variations.has(token);
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!checkTokenMatch(authHeader, HOOK_SECRET)) {
      console.warn("Auth failed — provided:", authHeader, "expected:", HOOK_SECRET ? "[hidden]" : "[no secret set]");
      return new Response(JSON.stringify({ error: "invalid_hook_token" }), { status: 401 });
    }

    const payload = await req.json();

    // Supabase send-email hook payload shapes vary; handle both possible payloads:
    // - If Supabase calls with { email, subject, html } from our manual test
    // - If it's the auth send-email hook, it sends { user: { email }, email_data: { token, token_hash, redirect_to } }
    const to = payload?.email ?? payload?.user?.email;
    if (!to) {
      console.error("Missing recipient in payload:", payload);
      return new Response(JSON.stringify({ error: "missing_recipient" }), { status: 400 });
    }

    // Build magic/verify link if this is an auth hook payload
    let html = payload?.html ?? "<p>Your email</p>";
    if (payload?.email_data) {
      const emailData = payload.email_data;
      const tokenHash = emailData.token_hash ?? emailData.token;
      const redirectTo = emailData.redirect_to ?? "/";
      const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "") ?? "";
      const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(emailData.email_action_type ?? "magiclink")}&redirect_to=${encodeURIComponent(redirectTo)}`;
      html = `<p>Sign in by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>Or use this code: <strong>${emailData.token ?? ""}</strong></p>`;
    }

    const subject = payload?.subject ?? "Your sign-in link";

    const r = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject,
      html,
    });

    console.log("Resend send response:", r);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), { status: 500 });
  }
});
