export const GA_ADS_ID = "AW-18484617025";
export const CONVERSION_SEND_TO = "AW-18484617025/wQ6WCPr71Y8dEMG-k-5E";

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * إرسال حدث الإحالة الناجحة (عملية شراء) إلى Google Ads
 * يتم تمرير transaction_id لمنع احتساب نفس العملية أكثر من مرة في Google Ads
 */
export function trackPurchaseConversion({
  transactionId,
  value,
  currency = "SAR",
}: {
  transactionId?: string;
  value?: number;
  currency?: string;
}) {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: CONVERSION_SEND_TO,
        transaction_id: transactionId || "",
        value: value,
        currency: currency,
      });
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push("event", "conversion", {
        send_to: CONVERSION_SEND_TO,
        transaction_id: transactionId || "",
        value: value,
        currency: currency,
      });
    }
  } catch (err) {
    console.error("Failed to track Google Ads conversion:", err);
  }
}
