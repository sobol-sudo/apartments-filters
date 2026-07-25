const FALLBACK_IMAGE = "/images/default.webp";

// Listing images are stored as bare public paths ("images/item_1.png"). Left as
// they are they resolve relative to the current route, which breaks as soon as
// the same card is rendered on a nested URL such as /apartments/1, so anchor
// them to the site root.
export function getImage(image: string): string {
  if (!image) return FALLBACK_IMAGE;
  if (/^(https?:)?\/\//.test(image) || image.startsWith("data:")) return image;

  return image.startsWith("/") ? image : `/${image}`;
}
