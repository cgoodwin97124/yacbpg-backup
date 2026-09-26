export const ART_STYLES = {
  comic: { label: "Comic Book (default)", keywords: ["comic book art", "crisp ink lines", "vibrant cel shading", "high contrast", "dramatic shadows"] },
  manga: { label: "Manga / Anime", keywords: ["manga style", "clean bold lineart", "screentone shading", "anime proportions"] },
  watercolor: { label: "Watercolor", keywords: ["watercolor painting", "soft washes", "loose edges", "textured paper"] },
  noir: { label: "Film Noir (B&W)", keywords: ["film noir style", "hard chiaroscuro lighting", "deep shadows", "gritty"] },
  pencil: { label: "Pencil Sketch", keywords: ["pencil sketch", "hatching and cross-hatching", "graphite lines"] },
  pixel: { label: "Pixel Art", keywords: ["pixel art", "chunky pixels", "16-bit game art"] },
  retro80s: { label: "Retro 80s Synthwave", keywords: ["retro 1980s style", "synthwave aesthetic", "chrome and neon"] },
  painterly: { label: "Painterly", keywords: ["painterly illustration", "thick expressive brushstrokes", "impasto"] },
  vintage50s: { label: "Vintage 1950s Comic", keywords: ["vintage 1950s comic style", "retro illustration", "grainy print texture"] },
  photo: {
    label: "Photorealistic",
    keywords: ["photorealistic", "shot on 35mm film", "sharp focus", "natural lighting", "candid photography"],
    negatives: "cartoon, anime, illustration, painting, drawing, blurry, deformed hands, text, speech bubbles, low quality"
  },
  cinematic: {
    label: "Cinematic Still",
    keywords: ["photorealistic", "cinematic film still", "anamorphic lens", "shallow depth of field", "dramatic lighting", "shot on 35mm"],
    negatives: "cartoon, anime, illustration, painting, drawing, blurry, deformed hands, text, speech bubbles, low quality"
  },
  vintagephoto: {
    label: "Vintage Photograph",
    keywords: ["photorealistic", "vintage photograph", "film grain", "soft focus", "analog camera"],
    negatives: "cartoon, anime, illustration, painting, drawing, blurry, deformed hands, text, speech bubbles, low quality"
  }
};

export const COLOR_PALETTES = {
  vibrant: { label: "Vibrant (default)", keywords: ["vibrant colors", "saturated hues"] },
  monochrome: { label: "Monochrome", keywords: ["monochrome", "black and white"] },
  sepia: { label: "Sepia / Aged", keywords: ["sepia tones", "aged photograph coloring"] },
  pastel: { label: "Soft Pastel", keywords: ["soft pastel colors", "gentle muted tones"] },
  neon: { label: "Neon / Cyberpunk", keywords: ["neon color palette", "electric blues and pinks"] },
  muted: { label: "Muted & Moody", keywords: ["muted desaturated colors", "moody atmosphere"] },
  warm: { label: "Warm Sunset", keywords: ["warm golden tones", "sunset coloring"] },
  cool: { label: "Cool Blue", keywords: ["cool blue tones", "cold lighting"] },
  faded: { label: "Faded Vintage", keywords: ["faded vintage colors", "yellowed paper tones"] }
};

export const DEFAULT_NEGATIVES = "photorealistic, 3d render, blurry, deformed hands, text, speech bubbles, low quality";
export const DEFAULT_POS = "comic book art, crisp ink lines, vibrant cel shading, high contrast, dramatic shadows";

export function composeKeywords(pos, neg, nsfw) {
  const positive = [pos, nsfw ? "" : "fully clothed"].filter(Boolean).join(", ");
  const negative = nsfw ? neg : (neg + ", nsfw, nudity, explicit").replace(/, ,+/g, ", ").replace(/^,\s*|,\s*$/g, "").trim();
  return { positive, negative };
}
