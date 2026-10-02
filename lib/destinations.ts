export const DESTINATIONS = ["Magazin Carei", "Magazin Foieni", "Clienti", "Marfa Primita"] as const;

export type Destination = (typeof DESTINATIONS)[number];

export function isDestination(v: string): v is Destination {
  return (DESTINATIONS as readonly string[]).includes(v);
}
