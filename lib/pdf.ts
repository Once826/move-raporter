import { getDocumentProxy } from "unpdf";

export interface TextItem {
  page: number;
  x: number;
  y: number;
  str: string;
}

export async function extractItems(data: Uint8Array): Promise<TextItem[]> {
  const pdf = await getDocumentProxy(data);
  const items: TextItem[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    for (const it of content.items) {
      if ("str" in it && it.str.trim()) {
        items.push({ page: p, x: it.transform[4], y: it.transform[5], str: it.str.trim() });
      }
    }
  }
  return items;
}
