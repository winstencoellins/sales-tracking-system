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

/** Prints only the invoice via a hidden iframe (no popup / app chrome). */
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
  <title></title>
  <style>
    @page { margin: 0; size: A4; }
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

  // Hidden iframe avoids popup blockers (unlike window.open).
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = frameWindow?.document;
  if (!frameWindow || !frameDocument) {
    iframe.remove();
    window.alert("Gagal menyiapkan cetak invoice. Silakan coba lagi.");
    return;
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  const cleanup = () => {
    iframe.remove();
  };

  const triggerPrint = () => {
    frameWindow.addEventListener("afterprint", cleanup);
    // Fallback if afterprint never fires (some mobile browsers).
    setTimeout(cleanup, 60_000);
    frameWindow.focus();
    frameWindow.print();
  };

  if (frameDocument.readyState === "complete") {
    setTimeout(triggerPrint, 50);
  } else {
    iframe.addEventListener("load", () => setTimeout(triggerPrint, 50));
  }
}
