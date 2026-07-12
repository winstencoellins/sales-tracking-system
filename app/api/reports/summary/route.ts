import { TransactionStatus } from "@/generated/prisma/client";
import { json, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: {
      transactions: {
        where: { status: TransactionStatus.AKTIF },
        select: { subtotal: true },
      },
    },
  });

  const rows = customers.map((c) => {
    const total = c.transactions.reduce((sum, t) => sum + t.subtotal, 0);
    return {
      customerId: c.id,
      customerName: c.name,
      transactionCount: c.transactions.length,
      total,
    };
  });

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const grandCount = rows.reduce((sum, r) => sum + r.transactionCount, 0);

  return json({
    customers: rows,
    grandTotal,
    grandCount,
  });
}
