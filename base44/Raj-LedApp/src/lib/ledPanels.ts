// src/data/panelsLibrary.ts
export type PanelCatalogItem = {
  brand: string
  model: string
  widthPx: number
  heightPx: number
  notes?: string
}

// IMPORTANT: widthPx/heightPx are the pixel grid PER TILE (X by Y pixels)
export const PANELS_LIBRARY: PanelCatalogItem[] = [
  // ROE Visual
  { brand: "ROE", model: "BP2",           widthPx: 176, heightPx: 176 }, // ~2.84 mm on 500×500 tile
  { brand: "ROE", model: "BP3 / 3.9",     widthPx: 128, heightPx: 128 }, // 3.9 mm on 500×500 tile
  { brand: "ROE", model: "CB5",     widthPx: 104, heightPx: 208 }, // 5 mm product on 600x1200 tile
  { brand: "ROE", model: "CB5 90°", widthPx: 208, heightPx:104}, // rotated CB5 panel  
  

  // Unilumin Upad III
  { brand: "Unilumin", model: "Upad III 2.6", widthPx: 192, heightPx: 192 }, // 2.6 mm 500×500
  { brand: "Unilumin", model: "Upad III 2.9", widthPx: 168, heightPx: 168 }, // 2.9 mm 500×500
  { brand: "Unilumin", model: "Upad III 3.9", widthPx: 128, heightPx: 128 }, // 3.9 mm 500×500

  // Absen
  { brand: "Absen", model: "A3 Pro 3.9",  widthPx: 128, heightPx: 128 }, // 3.9 mm 500×500
  { brand: "Absen", model: "PL2.5 Pro",   widthPx: 200, heightPx: 200 }, // 2.5 mm 500×500

  // INFiLED (common 3.9 mm)
  { brand: "INFiLED", model: "ER 3.9 (500)",   widthPx: 128, heightPx: 128 },
  { brand: "INFiLED", model: "ER 3.9 (1000)",  widthPx: 128, heightPx: 256 }, // 500×1000 tile variant

  // Gloshine MX
  { brand: "Gloshine", model: "MX 2.9",   widthPx: 168, heightPx: 168 }, // typical 2.976 mm 500×500
  { brand: "Gloshine", model: "MX 3.9",   widthPx: 128, heightPx: 128 }, // 3.91 mm 500×500

  // Dicolor
  { brand: "Dicolor", model: "Matrix 2.6", widthPx: 192, heightPx: 192 }, // 2.6 mm 500×500
]