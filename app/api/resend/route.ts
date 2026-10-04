import { NextRequest, NextResponse } from "next/server";
import { sendTelegram } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const { orderId, customerName } = await req.json();

  const text = [
    `🔄 تم طلب إعادة ارسال كود`,
    `🆔 رقم الطلب: ${orderId ?? "—"}`,
    `👤 اسم العميل: ${customerName ?? "—"}`,
  ].join("\n");

  await sendTelegram({ text });

  return NextResponse.json({ ok: true });
}
