import { NextResponse } from "next/server";
import { isDestination } from "@/lib/destinations";
import { parseDocument } from "@/lib/parsers";
import { buildReport } from "@/lib/report";
import type { ReportRow } from "@/lib/types";

export const runtime = "nodejs";

const MAX_FILES = 50;
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const form = await req.formData();
  const date = String(form.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const destination = String(form.get("destination") ?? "");
  if (!isDestination(destination)) {
    return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
  }
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0 || files.length > MAX_FILES) {
    return NextResponse.json({ error: `Provide 1-${MAX_FILES} PDF files` }, { status: 400 });
  }

  const [y, m, d] = date.split("-");
  const rows: ReportRow[] = [];
  const results: { name: string; rows: number; warnings: string[]; error?: string }[] = [];

  for (const file of files) {
    try {
      if (file.size > MAX_BYTES) throw new Error("File too large");
      const data = new Uint8Array(await file.arrayBuffer());
      if (String.fromCharCode(...data.slice(0, 5)) !== "%PDF-") throw new Error("Not a PDF file");
      const parsed = await parseDocument(data);
      rows.push(...parsed.rows);
      results.push({ name: file.name, rows: parsed.rows.length, warnings: parsed.warnings });
    } catch (e) {
      results.push({ name: file.name, rows: 0, warnings: [], error: e instanceof Error ? e.message : "Failed to parse" });
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows extracted", results }, { status: 422 });
  }

  const buf = await buildReport(rows, `${d}.${m}.${y}`, destination);
  return NextResponse.json({
    filename: `raport_${date}_${destination.replace(/\s+/g, "-")}.xlsx`,
    file: buf.toString("base64"),
    results,
  });
}
