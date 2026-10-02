import { extractItems } from "@/lib/pdf";
import type { ParseResult } from "@/lib/types";
import { isFactura, parseFactura } from "./factura";
import { isNotaTransfer, parseNotaTransfer } from "./notaTransfer";

export async function parseDocument(data: Uint8Array): Promise<ParseResult> {
  const items = await extractItems(data);
  if (isFactura(items)) return parseFactura(items);
  if (isNotaTransfer(items)) return parseNotaTransfer(items);
  throw new Error("Unsupported document type (expected Factura or Nota de transfer)");
}
