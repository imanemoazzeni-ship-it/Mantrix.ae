# Mantrix design refresh

The September 2026 design uses ivory, charcoal, and muted olive, Cormorant
Garamond display typography, close-up textile photographs, and an animated
fabric hero. The site remains static HTML, CSS, and JavaScript on the existing
GitHub/Vercel project.

## Motion and navigation

The shared script handles the compact mobile menu, scroll progress, text and
section reveals, pointer-responsive image depth, and the material marquee.
Ambient animation pauses outside the viewport. Visitors can pause motion;
the choice is retained for their browser session. The operating system's
reduced-motion preference takes priority. Content and navigation remain
accessible without JavaScript.

## Hero artwork

Generated with the built-in image-generation tool. This is illustrative fabric
artwork, not a photograph of a specific product or the company's inventory.

- Desktop asset: `images/ivory-drape.webp`
- Mobile asset: `images/ivory-drape-mobile.webp`

Generation prompt:

> Use case: photorealistic-natural. Asset type: background image for the hero of a luxury Dubai textile trading website. Create a highly refined editorial studio photograph of flowing warm ivory silk fabric, close up, wide horizontal 3:2 composition. Sculptural generous folds sweep diagonally from upper right through the center to lower left, rich fabric texture with a lustrous soft sheen, natural shadow valleys in deep taupe, lit by warm directional window light. Entire frame is fabric, abstract and tactile, no other objects. Restrained warm cream, champagne and stone neutral palette, premium fashion house campaign quality, realistic not plastic. The right half should have the most defined elegant sculptural folded peaks. No text, logos, borders, watermarks, collage, people or website mockup. This is a decorative illustrative background, not a specific product.

The other WebP files are optimized versions of the site's existing textile and
Dubai photographs. Existing author and licence credits are retained on the
inner pages. Source JPEG files were not modified as part of this refresh.

## Checks

Run `node scripts/check-site.cjs` to check local assets, page links, anchor
targets, unique IDs, headings, image alt attributes, and enquiry email links.
Run `node --check script.js` for JavaScript syntax validation.

The contact form continues to use `mailto:info@mantrix.ae`. Its copy explicitly
explains that visitors must send the enquiry from their email app. This design
refresh does not configure a server-side email service.
