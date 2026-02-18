export const GCAL_COLORS: Record<string, { name: string; hex: string }> = {
  "1": { name: "Lavender", hex: "#a4bdfc" },
  "2": { name: "Sage", hex: "#7ae7bf" },
  "3": { name: "Grape", hex: "#dbadff" },
  "4": { name: "Flamingo", hex: "#ff887c" },
  "5": { name: "Banana", hex: "#fbd75b" },
  "6": { name: "Tangerine", hex: "#ffb878" },
  "7": { name: "Peacock", hex: "#46d6db" },
  "8": { name: "Graphite", hex: "#e1e1e1" },
  "9": { name: "Blueberry", hex: "#5484ed" },
  "10": { name: "Basil", hex: "#51b749" },
  "11": { name: "Tomato", hex: "#dc2127" },
};

export function colorIdToHex(colorId: string | undefined, fallback: string): string {
  if (!colorId) return fallback;
  return GCAL_COLORS[colorId]?.hex ?? fallback;
}
