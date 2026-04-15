// Mirror of opengraph-image so Twitter-card-only scrapers still resolve a
// dedicated image. iMessage occasionally falls back to the Twitter card
// when a site's OG image is missing, so exposing both routes is the safe
// belt-and-suspenders move.
export { default, alt, size, contentType } from "./opengraph-image";
