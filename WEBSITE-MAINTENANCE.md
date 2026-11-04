# Hollin & Vale website maintenance

Reviewed 4 November 2026. This is a static GitHub Pages website; changes are published from this repository. Keep the approved ivory, stone, moss, clay and espresso identity, retail experience and separate trade route.

## Domains and source files

- Current canonical: **https://hollinandvale.co.uk/** (`CNAME`, canonicals, Open Graph, structured data, `robots.txt` and `sitemap.xml`). The actual secondary domain is `hollinandvale.com`. The supplied names `hollinvale.com` and `hollinvale.co.uk` did not resolve in this audit; do not replace the canonical with them.
- `catalogue.js`: shared sizes, retail prices, available colours and swatch-grid metadata. Product HTML also contains visible price/dimension tables and Product JSON-LD; update these together and verify every affected configuration.
- `marlow.html`, `calder.html`, `alder.html`, `rowan.html`: product descriptions, dimensions, materials, guarantees and enquiry links. `compare.html`, `collection.html` and `index.html` repeat selected facts/prices.
- `site.js` and `site.css`: navigation, product selection, prices and shared presentation. `selection.*`: save/share choices on the customer's device. `product-details.*`: gallery, selected dimensions and printable specification. `samples.js`: swatches, sample shortlist and context carried to contact.
- `contact.html`, `enquiry.js`, `enquiry-config.js`: enquiry form, validation, receipt/error handling and service URLs. The backend is a separate service. `delivery.html`, `terms.html`, `privacy.html`, `trade.html`: operational and legal information.
- `404.html`: useful missing-page recovery. Former product paths remain noindex redirect pages. `og-image.png` is a raster rendering of the existing brand SVG.

## Facts to confirm before changing promises

Keep supplier records for dimensions, construction, material composition, care, commercial suitability, production estimates and the five-year structural guarantee. Obtain the full applicable guarantee conditions. Do not infer firmness, fabric performance or commercial certification.

Confirm the geographic trading/service address and legal trading identity; physical sample availability, charges, postage and dispatch times; detailed delivery coverage/service, access limits and extra charges; return address, bulky-furniture collection arrangements and return costs. These operational details must be supplied before accepting an order where applicable. Finance is currently unavailable; do not add a provider, payment plan or badge without verified arrangements. Do not change retail prices or commercial terms without approval.

## Security and safe edits

All HTML pages contain a Content Security Policy and strict-origin referrer policy. Scripts are local; inline JSON-LD has an exact SHA-256 allowance. Inline event handlers were removed. Inline styles remain allowed because the existing swatch/gallery interface sets styles dynamically. Only the configured enquiry origin is allowed for cross-origin connections. If that endpoint changes, update the CSP too. Meta policies cannot replace server-only protections such as a `frame-ancestors` response header.

After editing any inline JSON-LD, regenerate each page's CSP script hashes from the exact saved text, then inspect the diff:

```bash
node <<'JS'
const fs = require('fs'), crypto = require('crypto');
for (const file of fs.readdirSync('.').filter(x => x.endsWith('.html'))) {
  let html = fs.readFileSync(file, 'utf8');
  const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => "'sha256-" + crypto.createHash('sha256').update(m[1]).digest('base64') + "'");
  html = html.replace(/script-src 'self'[^;]*/, "script-src 'self' " + [...new Set(hashes)].join(' '));
  fs.writeFileSync(file, html);
}
JS
git diff --check
```

Do not add script `unsafe-inline` or permissive external origins to silence an error. Keep keys and credentials out of this public repository. Bump HTML asset version parameters when shared CSS or JavaScript changes.

## Enquiries, measurement and routine checks

There is no active analytics collector in this frontend, so traffic, collected conversions and field Core Web Vitals are unmeasured. The enquiry success state provides an on-screen reference; it does not promise an automatic email acknowledgement. Automatic customer acknowledgement and owner email alerts have not been verified. Check the separate enquiry inbox/service and its operational notification path regularly.

Before publishing, check JavaScript syntax, JSON-LD and CSP hashes, local asset/link targets, catalogue/table/schema price agreement, and the real page response. In a browser, test 360/390px mobile, tablet and desktop layouts; keyboard/menu/Escape/resize; colour and price changes; product-to-contact/sample handoff; shortlist/save/share; gallery; printed specifications/checklist; invalid fields; backend error recovery and a clearly labelled test enquiry. Verify the record is available to the business and do not create an order or payment. Check the branded 404 at a nonexistent nested URL and test HTTPS, secondary-domain and path redirects separately.

The November optimisation reduced the three swatch atlases from 1,522,010 to 581,768 bytes (61.8%) using 192px tiles and WebP quality 85. Row/column order and catalogue geometry are unchanged. Nine representative light, dark and coloured tiles were visually compared at the largest normal 160px selected-swatch display. Physical samples remain the way to assess real colour and texture.
