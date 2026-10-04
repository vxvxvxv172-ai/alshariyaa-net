# Implementation Plan — Telegram Multi-ID Support

## Context discovered during exploration

- **Next.js 15.5.14**, React 19, TypeScript 5.9.3 (strict mode, `noEmit: true`)
- **Path alias**: `@/*` maps to the repo root (`./`), so `lib/telegram.ts` is importable as `@/lib/telegram.ts`
- **`lib/` folder**: does not exist yet — must be created
- **Telegram calls today**:
  - `notify/route.ts` — inline `fetch(…)` inside a `Promise.all([…])` alongside a backend save call; currently passes `{ chat_id, text, reply_markup }`
  - `verify/route.ts` — standalone `await fetch(…)`; passes `{ chat_id, text, reply_markup }` (inline keyboard)
  - `resend/route.ts` — standalone `await fetch(…)`; passes `{ chat_id, text }` (no reply_markup)
- **`.env.local`**: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are present as single values; no comment about multi-ID yet
- **Build / verify command**: `npx tsc --noEmit` (run inside `frontend/`)

---

## Implementation Plan

- [ ] 1. Create `frontend/lib/telegram.ts` — the shared Telegram helper.

  Define and export a `sendTelegram` function. It must:
  - Read `process.env.TELEGRAM_BOT_TOKEN` (string, throws a descriptive error if absent so misconfigurations are caught at runtime).
  - Read `process.env.TELEGRAM_CHAT_ID`, split on `,`, trim each part, filter empty strings — giving `string[]`.
  - Accept `{ text: string; reply_markup?: Record<string, unknown> }` as its argument type.
  - Fire one `fetch` per chat ID using `Promise.all`, posting to `https://api.telegram.org/bot<token>/sendMessage` with `Content-Type: application/json`.
  - Log `[telegram] sent to <id>` on success (response JSON logged at debug level) and `[telegram] error for <id>: <err>` on failure — using `.catch` inside the per-ID promise so a single failure doesn't abort the others.
  - Return `Promise<void>`.
  - Use no `any` — type the fetch response as `unknown` and the `reply_markup` field as `Record<string, unknown> | undefined`.

  **File to create**: `frontend/lib/telegram.ts`

  **Verify**: `cd frontend && npx tsc --noEmit` — no errors on the new file.

---

- [ ] 2. Update `frontend/app/api/notify/route.ts` — replace the inline Telegram fetch with `sendTelegram`.

  The current code has this structure inside `Promise.all([…])`:
  ```ts
  fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, reply_markup }),
    }
  ).then(r => r.json()).then(j => console.log(…)).catch(e => console.error(…)),
  ```

  Replace that entire expression (the second element of the `Promise.all` array) with:
  ```ts
  sendTelegram({ text, reply_markup }).catch(e => console.error("[notify] telegram error:", e)),
  ```

  Add the import at the top of the file:
  ```ts
  import { sendTelegram } from "@/lib/telegram";
  ```

  Do not touch any other logic — the backend `fetch`, the `orderId` generation, JWT extraction, response shape, etc. must remain identical.

  **File to modify**: `frontend/app/api/notify/route.ts`

  **Verify**: `cd frontend && npx tsc --noEmit` — no new errors.

---

- [ ] 3. Update `frontend/app/api/verify/route.ts` — replace the inline Telegram fetch with `sendTelegram`.

  The current code does:
  ```ts
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
        reply_markup: { inline_keyboard: [[{ text: "📋 نسخ الكود", copy_text: { text: code } }]] },
      }),
    }
  );
  ```

  Replace the entire `await fetch(…)` expression with:
  ```ts
  await sendTelegram({
    text,
    reply_markup: {
      inline_keyboard: [[{ text: "📋 نسخ الكود", copy_text: { text: code } }]],
    },
  });
  ```

  Add the import:
  ```ts
  import { sendTelegram } from "@/lib/telegram";
  ```

  Do not change any other logic.

  **File to modify**: `frontend/app/api/verify/route.ts`

  **Verify**: `cd frontend && npx tsc --noEmit` — no new errors.

---

- [ ] 4. Update `frontend/app/api/resend/route.ts` — replace the inline Telegram fetch with `sendTelegram`.

  The current code does:
  ```ts
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
    }
  );
  ```

  Replace it with:
  ```ts
  await sendTelegram({ text });
  ```

  Add the import:
  ```ts
  import { sendTelegram } from "@/lib/telegram";
  ```

  Note: no `reply_markup` here — that is correct and intentional (matches existing behaviour).

  Do not change any other logic.

  **File to modify**: `frontend/app/api/resend/route.ts`

  **Verify**: `cd frontend && npx tsc --noEmit` — no new errors.

---

- [ ] 5. Update `frontend/.env.local` — add the multi-ID comment above `TELEGRAM_CHAT_ID`.

  Find the production block:
  ```
  # production
  TELEGRAM_BOT_TOKEN=8954892337:AAFoSSi_R-1JlWpdqrs4BAAiR5OHr6_rzkQ
  TELEGRAM_CHAT_ID=7908355459
  ```

  Insert one comment line immediately before the `TELEGRAM_CHAT_ID=` line so it becomes:
  ```
  # production
  TELEGRAM_BOT_TOKEN=8954892337:AAFoSSi_R-1JlWpdqrs4BAAiR5OHr6_rzkQ
  # Add multiple IDs separated by commas: TELEGRAM_CHAT_ID=111,222,333
  TELEGRAM_CHAT_ID=7908355459
  ```

  All other lines — including the commented-out dev credentials, Resend keys, Google Maps key, maintenance flags, and backend URLs — must remain byte-for-byte identical.

  **File to modify**: `frontend/.env.local`

  **Verify**: Open the file and confirm (a) the comment line appears directly above `TELEGRAM_CHAT_ID=7908355459`, (b) no other line was altered.

---

- [ ] 6. Final TypeScript compilation check — confirms all four files type-check together with no errors.

  After all changes above are applied, run:
  ```
  cd c:\Users\loutf\OneDrive\Desktop\HAMZA\Hamza-simicard\alshareeha-sim\frontend
  npx tsc --noEmit
  ```

  Expected outcome: zero errors, zero warnings. If any error appears, fix it before considering the task complete. Common pitfalls to watch for:
  - `reply_markup` type mismatch between call sites and the helper signature — the inline-keyboard objects contain nested `copy_text` which is not a standard Telegram Bot API field but is valid JS; type it as `Record<string, unknown>` to stay loose without using `any`.
  - `process.env.*` returns `string | undefined`; the helper must handle the `undefined` case (guard or non-null assert with a thrown error message).
