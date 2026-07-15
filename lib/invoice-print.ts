import { formatDateInput, toDateInputValue, rupiah } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function buildInvoiceNumber(issuedAt: Date, itemCount: number): string {
  return `${issuedAt.getFullYear()}${String(issuedAt.getMonth() + 1).padStart(2, "0")}${String(issuedAt.getDate()).padStart(2, "0")}${String(itemCount).padStart(2, "0")}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isCoarsePointerDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  );
}

function buildInvoiceHtml({
  customerName,
  phoneNumber,
  transactions,
  issuedAt,
}: {
  customerName: string;
  phoneNumber?: string | null;
  transactions: Transaction[];
  issuedAt: Date;
}): { html: string; invoiceNo: string } {
  const total = transactions.reduce((sum, t) => sum + t.subtotal, 0);
  const invoiceNo = buildInvoiceNumber(issuedAt, transactions.length);
  const dateLabel = formatDateInput(toDateInputValue(issuedAt));

  const rows = transactions
    .map(
      (t) => `
      <tr>
        <td class="jenis">${escapeHtml(t.varietyName)}</td>
        <td class="num">${Number(t.weightKg)} kg</td>
        <td class="num">${t.quantity}</td>
        <td class="num">${escapeHtml(rupiah(t.pricePerKg))}</td>
        <td class="num strong">${escapeHtml(rupiah(t.subtotal))}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${escapeHtml(invoiceNo)}</title>
  <style>
    @page { margin: 12mm; size: A4; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #1a1a1a;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { max-width: 800px; margin: 0 auto; }
    .header {
      background: #0a2e1a;
      color: #fff;
      padding: 28px 32px;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 22px;
    }
    .meta .label {
      margin: 0;
      font-size: 12px;
      color: rgba(255,255,255,0.55);
    }
    .meta .value {
      margin: 6px 0 0;
      font-size: 15px;
      font-weight: 600;
      color: rgba(255,255,255,0.92);
    }
    .body { padding: 28px 32px 36px; }
    .bill-label {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
    }
    .bill-name {
      margin: 8px 0 0;
      font-size: 15px;
      color: #66706a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 28px;
    }
    thead th {
      background: #ebf1ec;
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      text-align: left;
    }
    thead th.num { text-align: right; }
    tbody td {
      padding: 14px 12px;
      font-size: 14px;
      border-bottom: 1px solid #e8eee9;
      vertical-align: top;
    }
    td.jenis { font-weight: 500; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; color: #66706a; }
    td.strong { color: #1a1a1a; font-weight: 600; }
    .totals {
      margin-top: 8px;
      border-top: 1px solid #1a1a1a;
      padding-top: 16px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 4px;
      font-size: 15px;
      font-weight: 600;
    }
    .due {
      margin-top: 12px;
      border-top: 1px solid #1a1a1a;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #0a2e1a;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .due .amount {
      font-variant-numeric: tabular-nums;
      font-size: 19px;
    }
    @media print {
      html, body { background: #fff; }
      .page { max-width: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Invoice</h1>
      <div class="meta">
        <div>
          <p class="label">Invoice Number:</p>
          <p class="value">${escapeHtml(invoiceNo)}</p>
        </div>
        <div>
          <p class="label">Date:</p>
          <p class="value">${escapeHtml(dateLabel)}</p>
        </div>
      </div>
    </div>
    <div class="body">
      <p class="bill-label">Bill To</p>
      <p class="bill-name">${escapeHtml(customerName)}${
        phoneNumber
          ? `<br />${escapeHtml(phoneNumber)}`
          : ""
      }</p>
      <table>
        <thead>
          <tr>
            <th>Jenis</th>
            <th class="num">Berat</th>
            <th class="num">Qty</th>
            <th class="num">Harga</th>
            <th class="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div class="totals-row">
          <span>Invoice Total</span>
          <span>${escapeHtml(rupiah(total))}</span>
        </div>
      </div>
      <div class="due">
        <span>Amount Due</span>
        <span class="amount">${escapeHtml(rupiah(total))}</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { html, invoiceNo };
}

function printWhenReady(
  target: Window,
  onDone: () => void,
): void {
  let printed = false;

  const run = () => {
    if (printed) return;
    printed = true;
    try {
      target.focus();
      target.print();
    } catch {
      // ignore — some WebViews throw if print UI is unavailable
    } finally {
      target.addEventListener("afterprint", onDone, { once: true });
      // afterprint is unreliable on many mobile browsers
      setTimeout(onDone, 60_000);
    }
  };

  // Give layout/paint time — blank pages are common if print() is too early.
  const schedule = () => setTimeout(run, 300);

  try {
    const doc = target.document;
    if (doc.readyState === "complete") {
      schedule();
    } else {
      target.addEventListener("load", schedule, { once: true });
      // Safety if load never fires after document.write
      setTimeout(schedule, 500);
    }
  } catch {
    schedule();
  }
}

/** Desktop / fallback: full-size offscreen iframe (0×0 iframes print blank on WebKit). */
function printViaIframe(html: string): boolean {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Invoice print");
  // Real viewport size is required — width/height 0 yields blank PDFs on iOS/Android.
  iframe.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;border:0;margin:0;padding:0;opacity:0;pointer-events:none;z-index:-1;";

  let cleaned = false;
  let started = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    URL.revokeObjectURL(url);
    iframe.remove();
  };

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  iframe.src = url;
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    cleanup();
    return false;
  }

  const start = () => {
    if (started || cleaned) return;
    started = true;
    printWhenReady(frameWindow, cleanup);
  };

  iframe.addEventListener("load", start, { once: true });
  // Fallback if load is skipped
  setTimeout(start, 800);

  return true;
}

/**
 * Mobile-first: open invoice in a new tab (same user gesture), then print.
 * Avoids blank PDFs from zero-size iframes on iOS Safari / Android Chrome.
 */
function printViaPopup(html: string): boolean {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");

  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    URL.revokeObjectURL(url);
    try {
      win.close();
    } catch {
      // tab may already be closed by the user
    }
  };

  printWhenReady(win, cleanup);
  return true;
}

/** Prints only the invoice (no app chrome). Mobile-safe. */
export function printInvoiceDocument({
  customerName,
  phoneNumber,
  transactions,
  issuedAt,
}: {
  customerName: string;
  phoneNumber?: string | null;
  transactions: Transaction[];
  issuedAt: Date;
}): void {
  const { html } = buildInvoiceHtml({
    customerName,
    phoneNumber,
    transactions,
    issuedAt,
  });

  // On phones/tablets prefer a real window — more reliable native print/PDF UI.
  if (isCoarsePointerDevice()) {
    if (printViaPopup(html)) return;
    if (printViaIframe(html)) return;
  } else {
    if (printViaIframe(html)) return;
    if (printViaPopup(html)) return;
  }

  window.alert(
    "Gagal menyiapkan cetak invoice. Izinkan popup untuk situs ini, lalu coba lagi.",
  );
}
