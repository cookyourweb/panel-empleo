/**
 * Contraste segun WCAG 2.1, formula de luminancia relativa.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */

type Rgb = { r: number; g: number; b: number };

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/** Los tokens de shadcn se declaran como triplete sin funcion: "183.4 92.7% 62.2%". */
function hslToRgb(hsl: string): Rgb {
  const [h, s, l] = hsl.split(/\s+/).map((part) => parseFloat(part));
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const offset = lightness - chroma / 2;

  const sector = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary],
  ][sector];

  return {
    r: Math.round((r + offset) * 255),
    g: Math.round((g + offset) * 255),
    b: Math.round((b + offset) * 255),
  };
}

function toRgb(color: string): Rgb {
  return color.trim().startsWith("#") ? hexToRgb(color.trim()) : hslToRgb(color);
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (raw: number) => {
    const c = raw / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Devuelve el contraste entre dos colores, de 1:1 (identicos) a 21:1 (negro/blanco).
 * Acepta hexadecimal ("#45eef8") o triplete HSL de shadcn ("183.4 92.7% 62.2%").
 */
export function contrastRatio(a: string, b: string): number {
  const luminances = [a, b].map((color) => relativeLuminance(toRgb(color)));
  const lighter = Math.max(...luminances);
  const darker = Math.min(...luminances);
  return (lighter + 0.05) / (darker + 0.05);
}
