export interface ReportRow {
  product: string;
  lot: string;
  um: string;
  quantity: number;
  clientName: string;
  clientCif: string;
}

export interface ParseResult {
  rows: ReportRow[];
  warnings: string[];
}
