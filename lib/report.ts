import ExcelJS from "exceljs";
import type { ReportRow } from "@/lib/types";

const COLUMNS = [
  { header: "Denumire produse/servicii", key: "product", width: 46 },
  { header: "Numar Lot", key: "lot", width: 16 },
  { header: "UM", key: "um", width: 8 },
  { header: "Cantitate", key: "quantity", width: 12 },
  { header: "Nume Client", key: "clientName", width: 32 },
  { header: "Client CIF", key: "clientCif", width: 16 },
] as const;

export async function buildReport(rows: ReportRow[], date: string, destination: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Raport");
  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));

  ws.mergeCells(1, 1, 1, COLUMNS.length);
  const title = ws.getCell(1, 1);
  title.value = `Data: ${date}    Destinatie: ${destination}`;
  title.font = { bold: true, size: 14 };

  const headerRow = ws.getRow(2);
  COLUMNS.forEach((c, i) => (headerRow.getCell(i + 1).value = c.header));
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
    cell.border = { bottom: { style: "thin" } };
  });

  for (const r of rows) ws.addRow(r);
  ws.views = [{ state: "frozen", ySplit: 2 }];

  return Buffer.from(await wb.xlsx.writeBuffer());
}
