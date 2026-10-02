export const LANGS = ["ro", "hu"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_LABELS: Record<Lang, string> = { ro: "RO", hu: "HU" };

export interface Strings {
  title: string;
  subtitle: string;
  date: string;
  destination: string;
  dropTitle: string;
  dropHint: string;
  files: (n: number) => string;
  clearAll: string;
  remove: (name: string) => string;
  rowsExtracted: (n: number) => string;
  generate: string;
  generating: string;
  downloaded: (file: string, rows: number) => string;
  failed: string;
}

export const STRINGS: Record<Lang, Strings> = {
  ro: {
    title: "Raport Transferuri",
    subtitle: "Incarca facturi sau note de transfer (PDF) si descarca raportul in format Excel.",
    date: "Data",
    destination: "Destinatie",
    dropTitle: "Trage fisierele PDF aici",
    dropHint: "sau click pentru a selecta (mai multe odata)",
    files: (n) => `${n} fisiere`,
    clearAll: "Sterge tot",
    remove: (name) => `Elimina ${name}`,
    rowsExtracted: (n) => `${n} randuri extrase`,
    generate: "Genereaza raport",
    generating: "Se genereaza...",
    downloaded: (file, rows) => `${file} descarcat (${rows} randuri)`,
    failed: "Raportul nu a putut fi generat",
  },
  hu: {
    title: "Szállítási jelentés",
    subtitle: "Tölts fel számlákat vagy átadási jegyzékeket (PDF), és töltsd le a jelentést Excel formátumban.",
    date: "Dátum",
    destination: "Rendeltetés",
    dropTitle: "Húzd ide a PDF fájlokat",
    dropHint: "vagy kattints a kiválasztáshoz (több is lehet)",
    files: (n) => `${n} fájl`,
    clearAll: "Összes törlése",
    remove: (name) => `${name} eltávolítása`,
    rowsExtracted: (n) => `${n} sor kinyerve`,
    generate: "Jelentés készítése",
    generating: "Készítés...",
    downloaded: (file, rows) => `${file} letöltve (${rows} sor)`,
    failed: "A jelentést nem sikerült elkészíteni",
  },
};
