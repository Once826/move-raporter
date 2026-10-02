import type { TextItem } from "@/lib/pdf";
import type { ParseResult, ReportRow } from "@/lib/types";

const NAME_X = 50;
const UM_X = 240;
const QTY_X = 300;
const PRICE_X = 370;
const CLIENT_X = 285;

export function isFactura(items: TextItem[]): boolean {
  return items.some((i) => i.str.toUpperCase() === "FACTURA");
}

export function parseFactura(all: TextItem[]): ParseResult {
  const warnings: string[] = [];
  const items = all.filter((i) => i.page === 1);

  const clientLabel = items.find((i) => i.str === "Client" && i.x >= CLIENT_X - 10);
  if (!clientLabel) throw new Error("Client block not found");
  const clientItems = items
    .filter((i) => i.x >= CLIENT_X - 10 && i.y < clientLabel.y && i.y > clientLabel.y - 40)
    .sort((a, b) => b.y - a.y || a.x - b.x);
  const clientName = clientItems[0]?.str ?? "";
  const clientCif = clientItems.find((i) => /^CIF\b/i.test(i.str))?.str.replace(/^CIF\s*/i, "") ?? "";
  if (!clientName) warnings.push("Client name not found");
  if (!clientCif) warnings.push("Client CIF not found");

  const header = items.find((i) => i.str === "Nr. crt.");
  if (!header) throw new Error("Product table not found");
  const footer = items.find((i) => i.str === "Emis de" && i.y < header.y);
  const bottom = footer ? footer.y : -Infinity;

  const body = items.filter((i) => i.y < header.y - 1 && i.y > bottom);
  const starts = body
    .filter((i) => i.x < 45 && /^\d+$/.test(i.str))
    .sort((a, b) => b.y - a.y);

  const rows: ReportRow[] = [];
  starts.forEach((start, idx) => {
    const top = start.y + 3;
    const next = starts[idx + 1];
    const lower = next ? next.y + 3 : bottom;
    const cells = body.filter((i) => i.y <= top && i.y > lower);
    const nameLines = cells
      .filter((i) => i.x >= NAME_X && i.x < UM_X)
      .sort((a, b) => b.y - a.y)
      .map((i) => i.str);
    const lot = nameLines.length > 1 ? nameLines[nameLines.length - 1] : "";
    const product = (nameLines.length > 1 ? nameLines.slice(0, -1) : nameLines).join(" ");
    const um = cells.find((i) => i.x >= UM_X && i.x < QTY_X)?.str ?? "BUC";
    const qtyStr = cells.find((i) => i.x >= QTY_X && i.x < PRICE_X && /^[\d.,]+$/.test(i.str))?.str;
    const quantity = qtyStr ? Number(qtyStr.replace(/,/g, "")) : NaN;
    if (!Number.isFinite(quantity)) {
      warnings.push(`Row ${start.str}: quantity not found`);
      return;
    }
    if (!lot) warnings.push(`Row ${start.str}: lot not found`);
    rows.push({ product, lot, um, quantity, clientName, clientCif });
  });

  if (rows.length === 0) warnings.push("No product rows found");
  return { rows, warnings };
}
