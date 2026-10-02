import type { TextItem } from "@/lib/pdf";
import type { ParseResult, ReportRow } from "@/lib/types";

const NAME_MAX_X = 160;
const UM_MAX_X = 240;
const QTY_MAX_X = 320;

export function isNotaTransfer(items: TextItem[]): boolean {
  return items.some((i) => i.str === "Gestiune primitoare");
}

export function parseNotaTransfer(all: TextItem[]): ParseResult {
  const items = all.filter((i) => i.page === 1);
  const warnings: string[] = [];

  const label = items.find((i) => i.str === "Gestiune primitoare");
  if (!label) throw new Error("Receiving location not found");
  const clientName = items
    .filter((i) => Math.abs(i.x - label.x) < 5 && i.y < label.y && i.y > label.y - 20)
    .sort((a, b) => b.y - a.y)[0]?.str ?? "";
  if (!clientName) warnings.push("Client name not found");
  // Transfer notes carry no client CIF or lot number.
  const clientCif = "";

  const header = items.find((i) => i.str.startsWith("Denumire / Cod articol transferat"));
  if (!header) throw new Error("Product table not found");
  const total = items.find((i) => i.str === "Total" && i.y < header.y);
  const bottom = total ? total.y : -Infinity;

  const body = items.filter((i) => i.y < header.y - 1 && i.y > bottom + 1);
  const nameCol = body.filter((i) => i.x < NAME_MAX_X && !/^[-\s]+$/.test(i.str)).sort((a, b) => b.y - a.y);

  const rows: ReportRow[] = [];
  let lines: TextItem[] = [];
  for (const it of nameCol) {
    if (!/^\d{4,}$/.test(it.str)) {
      lines.push(it);
      continue;
    }
    const first = lines[0];
    if (!first) {
      warnings.push(`Code ${it.str}: product name not found`);
      continue;
    }
    const sameLine = body.filter((i) => Math.abs(i.y - first.y) < 2);
    const um = sameLine.find((i) => i.x >= NAME_MAX_X && i.x < UM_MAX_X)?.str ?? "BUC";
    const qtyStr = sameLine.find((i) => i.x >= UM_MAX_X && i.x < QTY_MAX_X && /^[\d.,]+$/.test(i.str))?.str;
    const quantity = qtyStr ? Number(qtyStr.replace(/,/g, "")) : NaN;
    if (Number.isFinite(quantity)) {
      rows.push({ product: lines.map((l) => l.str).join(" "), lot: "", um, quantity, clientName, clientCif });
    } else {
      warnings.push(`Code ${it.str}: quantity not found`);
    }
    lines = [];
  }

  if (rows.length === 0) warnings.push("No product rows found");
  return { rows, warnings };
}
