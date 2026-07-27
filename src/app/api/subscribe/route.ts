import { NextRequest, NextResponse } from "next/server";
import { isConfigured } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const PROMO_CODE = "IT5";

// ── Local fallback ────────────────────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), "data");
const EMAILS_FILE = path.join(DATA_DIR, "subscribers.json");

function readEmailsLocal(): string[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(EMAILS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(EMAILS_FILE, "utf-8")); } catch { return []; }
}
function saveEmailLocal(email: string) {
  const emails = readEmailsLocal();
  if (!emails.includes(email)) {
    emails.push(email);
    fs.writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2), "utf-8");
  }
}

// ── Welcome email HTML ────────────────────────────────────────────────────────
function buildEmailHtml(email: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Ваш промокод IT Tkani</title>
</head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e0d8;">
          <!-- Top accent -->
          <tr><td style="height:3px;background:#2c2825;"></td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#b8b0a8;">
                IT Tkani
              </p>
              <h1 style="margin:0;font-size:26px;font-weight:600;color:#2c2825;line-height:1.3;">
                Ваш промокод на скидку 5%
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0 0 24px;font-size:14px;color:#8a8178;line-height:1.7;">
                Спасибо, что подписались! Используйте этот промокод при следующем заказе и получите скидку&nbsp;5%:
              </p>

              <!-- Promo code box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center" style="border:2px solid #2c2825;padding:20px;">
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8a8178;">
                      промокод
                    </p>
                    <p style="margin:0;font-size:38px;font-weight:700;letter-spacing:0.25em;color:#2c2825;">
                      ${PROMO_CODE}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:13px;color:#8a8178;line-height:1.6;">
                Чтобы воспользоваться скидкой, напишите нам в Telegram или WhatsApp и укажите этот промокод при оформлении заказа.
              </p>

              <!-- CTA buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td width="48%" align="center" style="padding-right:6px;">
                    <a href="https://t.me/it_tkani_admin"
                      style="display:block;padding:13px;background:#2c2825;color:#ffffff;font-size:13px;letter-spacing:0.06em;text-decoration:none;text-align:center;">
                      Telegram
                    </a>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" align="center" style="padding-left:6px;">
                    <a href="https://wa.me/79851858584"
                      style="display:block;padding:13px;border:1px solid #2c2825;color:#2c2825;font-size:13px;letter-spacing:0.06em;text-decoration:none;text-align:center;">
                      WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="height:1px;background:#e8e0d8;margin:0 40px;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#b8b0a8;line-height:1.6;">
                IT Tkani &nbsp;·&nbsp; Ткани из Италии<br/>
                Это письмо отправлено на ${email}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Send welcome email via Resend ─────────────────────────────────────────────
async function sendWelcomeEmail(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if not configured

  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "IT Tkani <noreply@ittkani.com>",
    to: email,
    subject: `Ваш промокод ${PROMO_CODE} — скидка 5% на первый заказ`,
    html: buildEmailHtml(email),
  });
}

// ── POST /api/subscribe ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const normalised = email.trim().toLowerCase();

    // Save to Supabase or local file
    if (isConfigured) {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase
        .from("subscribers")
        .upsert({ email: normalised }, { onConflict: "email", ignoreDuplicates: true });
      if (error) {
        console.error("Supabase subscribe error:", error.message);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }
    } else {
      saveEmailLocal(normalised);
    }

    // Send welcome email (non-blocking — don't fail if email fails)
    sendWelcomeEmail(normalised).catch((err) =>
      console.error("Email send error:", err)
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ── GET /api/subscribe (admin only) ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const isAuthed = req.cookies.get("admin_auth")?.value === "authenticated";
  if (!isAuthed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isConfigured) {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("subscribers")
      .select("email, created_at")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ emails: data, count: data.length });
  }

  const emails = readEmailsLocal();
  return NextResponse.json({ emails, count: emails.length });
}
