// lib/telegram.ts
interface SendTelegramOptions {
  text: string;
  reply_markup?: object;
}

export async function sendTelegram(options: SendTelegramOptions): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const rawIds = process.env.TELEGRAM_CHAT_ID ?? "";
  const chatIds = rawIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!token || chatIds.length === 0) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured");
    return;
  }

  await Promise.all(
    chatIds.map((chatId) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, ...options }),
      })
        .then((r) => r.json())
        .then((j) => console.log(`[telegram] chat ${chatId}:`, JSON.stringify(j)))
        .catch((e) => console.error(`[telegram] chat ${chatId} error:`, e))
    )
  );
}
