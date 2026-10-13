# Nano Motion: OpenAI Pixel reference implementation

A demo store for Nano Motion, a fictional premium activewear brand launching on ChatGPT Ads. The site exists to show one thing well: **the OpenAI Measurement Pixel deployed deliberately**, with a ranked signal plan, correct payloads, idempotent conversions, consent by market, and a clear line where the pixel stops and the Conversions API takes over.

- **Live site:** https://nano-motion-three.vercel.app/
- **Demo mode:** add `?demo=1` to any URL to open the pixel event log beside the store. In the panel, `–` minimizes it to a corner bar, `×` closes it (or use `?demo=0`)
- **Pixel ID:** `1GtqyL7Rgr4qk4pR3LFbss`
- **Stack:** plain HTML, CSS, JavaScript. No framework, no build step, no backend, so every line is readable.
- **Source code:** this repository; the site footer links here ("Measurement plan and source code"). Public access is required before submission so reviewers can open the link.

---

**Specification baseline: October 12, 2026.** This README describes the current implementation and decisions, not a historical change log. The browser pixel is deliberately client-side; server-side Conversions API delivery and ingestion/reporting checks are separate production concerns. The demo has no server-side order authority.

## 1. What the business needs, and what we measure for it

| Stakeholder need | Measurement answer |
| --- | --- |
| CMO: spend tied to valuable onsite actions from day one | `order_created` with value, currency and items, live at launch |
| CMO: membership program | `trial_started` and `subscription_created`, tracked separately from account signup |
| CTO: straightforward, scalable, credible | One snippet, one tracking file, standard events first, dedupe-ready event IDs, consent built in |
| Both: international expansion | Per-market prices in minor units, currency on every value event, consent gating in opt-in markets, a demand signal for markets not yet launched |

**The test for every event:** does sending it to an ad platform improve optimization, attribution, or reporting on ad value? If not, it belongs in Nano Motion's own analytics, not the ads pixel.

## 2. Event plan: 12 events, 3 tiers

| Tier | Event | Fires when | Data shape | event_id | Optimizable |
| --- | --- | --- | --- | --- | --- |
| 1 Pay for | `order_created` | Confirmation page, once per order | contents | Order ID | Yes |
| 1 | `subscription_created` | Paid Club plan confirmed | plan_enrollment | Subscription ID | Yes |
| 1 | `trial_started` | Free Club trial confirmed | plan_enrollment | Trial ID | Yes |
| 2 Volume and diagnosis | `checkout_started` | Checkout loads with items | contents | none | Yes |
| 2 | `items_added` | Add to bag, or add the whole kit | contents | none | Yes |
| 2 | `contents_viewed` | Product page loads | contents | none | Yes |
| 2 | `registration_completed` | Account created | customer_action | Account ID | Yes |
| 2 | `page_viewed` | Every page load | contents | none | Yes |
| 3 Insight (custom) | `fit_finder_started` | First Fit Finder answer | custom | none | No |
| 3 | `fit_finder_completed` | Fit Finder result shown | custom | none | No |
| 3 | `back_in_stock_signup` | Email submitted on a sold-out size | custom | none | No |
| 3 | `market_selected` | Market or currency switched | custom | none | No |

**Why these tiers**
- **Tier 1** is what Nano Motion pays for: revenue and members.
- **Tier 2** gives the optimizer enough volume early and shows where the funnel leaks. A new advertiser has few purchases on day one, so we recommend launching conversion-optimized campaigns on `checkout_started`, with purchases attached for reporting, then launching a purchase-optimized campaign once volume supports it. The optimization event is locked per campaign, so the switch is a new campaign, planned upfront.
- **Tier 3** is category-specific insight. Custom events cannot be optimization goals, so they are reporting only.

**Deliberately not sent to the ad platform**

| Signal | Why not | Where it belongs |
| --- | --- | --- |
| Newsletter signup as `lead_created` | It is optimizable; a campaign could end up optimizing toward signups instead of sales | Analytics, email platform |
| Wishlist, referrals, reviews, pro-program applications | Real signals, but not ad optimization or attribution inputs | Analytics |
| Gift card purchase vs. redemption | Order value already captures revenue | Order system, analytics |
| Scroll depth, time on page, clicks | Engagement noise | Analytics |
| A separate bundle event | Kits go through `items_added` with several items in `contents[]` | n/a |

## 3. Payload rules applied

- **Amounts are integers in the currency's ISO 4217 minor unit.** USD 98.00 is sent as `9800`. **JPY has no minor unit**, so ¥14,800 is sent as `14800`, not `1480000`. Prices are stored per market already in minor units, so there is no runtime conversion or rounding.
- **Currency is sent with every amount.**
- **Item IDs are variant-level once a size is chosen:** style + color + size, e.g. `NM-RJ-01-BLK-M`. Product views use the style ID, `NM-RJ-01`. Item names carry color and size in words.
- **`contents[]` uses only the fields the pixel accepts:** id, name, content_type, quantity, amount. Size and color as structured fields (`variant_dict`) and `group_id` are Conversions API only, so size lives in the ID for now.
- **Order value is the merchandise subtotal**, excluding tax and shipping.

Example, sent on the confirmation page:

```js
oaiq('measure', 'order_created', {
  type: 'contents', amount: 27200, currency: 'USD',
  contents: [
    { id: 'NM-RJ-01-BLK-M', name: 'Stride Running Jacket (Black, M)', content_type: 'product', quantity: 2, amount: 9800 },
    { id: 'NM-SK-02-WHT-M', name: 'Tempo Run Socks (White, M)', content_type: 'product', quantity: 1, amount: 1800 },
    { id: 'NM-TS-04-STN-M', name: 'Base Training Tee (Stone, M)', content_type: 'product', quantity: 1, amount: 5800 }
  ]
}, { event_id: order.id }); // e.g., NM-MGN4X2Q1-7F3A9C21; created once per order
```

## 4. Idempotency: every conversion counts once

| Layer | Solves | How |
| --- | --- | --- |
| Business ID as `event_id` | The same conversion arriving from any source | The order, subscription, trial or account ID is created once with the record and reused as `event_id`. Not a random browser UUID: the server already knows the order ID, so the Conversions API can send the same one. |
| Fire-once guard | Refresh, back button, reopened tab | Sent IDs are recorded; a repeat is skipped and logged as "skipped: already sent" |
| Platform dedupe | Pixel and Conversions API both send it | OpenAI matches on Pixel ID + event name + event ID and keeps the first event |

The fire-once guard alone is not a guarantee (storage can be cleared, another device). A stable business event ID enables platform-side deduplication when supported; it cannot, by itself, guarantee end-to-end exactly-once ingestion or attribution. Funnel events like `page_viewed` legitimately repeat and carry no ID.

**IDs must be unique across all shoppers,** because OpenAI dedupes on Pixel ID + event + ID regardless of who sent it: two orders sharing an ID would count as one. In production the ID comes from the order or billing system. This demo has no backend, so it generates a collision-resistant ID in the browser from time plus random bytes, e.g. `NM-MGN4X2Q1-7F3A9C21`.

## 5. Matching data

Hashed identifiers go in `oaiq('init', { user })`, not in events. The site re-runs `init` when a visitor identifies: account signup, checkout (guests included), Club signup, back-in-stock signup. Later pages pass the stored hashes in the head snippet.

| Field | Normalization before SHA-256 | Example |
| --- | --- | --- |
| Email | Trim, lowercase | ` Jane.Doe@Mail.com ` → `jane.doe@mail.com` |
| Phone | Keep country code; strip spaces, brackets, dots, hyphens, leading `+` and zeros. National numbers get the market's calling code | `+1 (415) 555-2671` → `14155552671`; US `415 555 2671` → `14155552671`; UK `07911 123456` → `447911123456` |
| First / last name | Lowercase; remove whitespace and ASCII punctuation; keep accents | `O'Connor` → `oconnor`, `José` → `josé` |
| Country, city, postal code | Sent raw | `US`, `San Francisco`, `94107` |

Hashing runs in the browser with `crypto.subtle`. Raw email, phone and names are never sent or stored; only hashes are kept, and only with consent: without consent, identifiers are not hashed, stored or sent, and declining deletes stored hashes. If hashing is unavailable, identifiers are skipped and the purchase still completes.

Phone hashes only match when the country code is present, and shoppers usually type national numbers, so the site adds the market's calling code (US 1, UK 44, Germany 49, Japan 81) unless the number already starts with `+` or `00`. The phone hash produced by the site matches the example in OpenAI's documentation. We implement matching explicitly, rather than relying on automatic advanced matching, so the demo shows exactly what leaves the browser.

## 6. Consent and international

| Market | Currency | Minor unit | Jacket | Sent as | Consent |
| --- | --- | --- | --- | --- | --- |
| United States | USD | 2 | $98.00 | `9800` | On by default; footer opt-out |
| United Kingdom | GBP | 2 | £78.00 | `7800` | Opt-in banner |
| Germany | EUR | 2 | €89.00 | `8900` | Opt-in banner |
| Japan | JPY | 0 | ¥14,800 | `14800` | On by default |

- In opt-in markets the head snippet calls `oaiq('consent', false)` **before** `init`. Nothing is sent until the visitor accepts. Events from before consent are not replayed, by design. Declining also removes the pixel's cookies.
- The footer always displays **Your Privacy Choices**, opening an accessible On/Off switch that reflects the effective measurement state. US/Japan start On unless opted out or GPC is active; UK/Germany start Off and show an opt-in banner on first visit. Switching the control updates the saved preference and SDK consent immediately. An active GPC signal locks the switch Off. The market dropdown is a demonstration control, not real geolocation.
- In production, Nano Motion's consent platform (OneTrust, Osano or similar) would own privacy choices and make these consent calls. Geographic defaults and applicable legal rules require Nano Motion privacy/legal approval.
- **Global Privacy Control is honored in every market.** If the browser sends GPC (`navigator.globalPrivacyControl`), the head snippet calls `consent false` before `init` and measurement remains disabled while GPC is active, even when a prior site preference was granted. CCPA and several other US states require honoring GPC.
- One Pixel ID covers all markets. Multiple Pixel IDs are meant for multiple advertisers or partners on one site, not one per country.
- `market_selected` records demand from markets before Nano Motion launches there.
- A privacy notice page lists the pixel, its first-party cookies (`__oppref`, `__obref`) and exactly what is sent.

## 7. Security

| Control | What the site does | Why |
| --- | --- | --- |
| Content Security Policy | Enforced via `vercel.json`: scripts only from this site, `bzrcdn.openai.com` and one hashed inline script (the pixel snippet); connections only to this site and OpenAI's pixel domains; no plugins, no framing, forms post only to this site | Exactly the sources OpenAI's docs list; nothing else can run or send data |
| No `unsafe-inline` for scripts | Page logic lives in `assets/pages/*.js`; the only inline script is the pixel snippet, allowed by its SHA-256 hash | OpenAI's docs advise against adding `unsafe-inline` for the pixel. A nonce needs a server per response; a hash suits a static site |
| Other headers | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone, geolocation, payment off), `Strict-Transport-Security`, `frame-ancestors 'none'` | Standard hardening a CTO's security team will check first |
| Cookies | Both pixel cookies are first-party (`__oppref`, `__obref`), set on this site's domain | Third-party cookie blocking does not affect the pixel |
| Keys | No API key in the browser. The pixel needs only its public Pixel ID | The Conversions API key lives only on the server |
| Personal data | Only SHA-256 hashes leave the browser, only with consent | Data minimization |

**Why no Subresource Integrity (SRI) on `oaiq.min.js`:** the SDK is evergreen (OpenAI updates it in place), so a pinned hash would break the pixel on the next release. The control is the CSP allowlist plus vendor review; the trade-off is worth stating plainly.

**When the CSP changes:** if the pixel snippet's text changes, its hash in `vercel.json` must be recomputed, or the browser blocks it.

## 8. What the pixel cannot do, and the alternative

The pixel is the right day-one tool: one snippet, live in days. OpenAI's own documentation calls the Conversions API more reliable than the pixel alone.

| The pixel cannot | Why | Alternative |
| --- | --- | --- |
| Recover events lost to ad blockers and browser limits | It runs in the browser | Conversions API, same event ID for dedupe |
| Confirm the order actually succeeded | It fires on page load | Server sends confirmed orders |
| Track trial-to-paid, renewals, cancellations | No shopper is on the site when they happen | Server events |
| Send size, color and product group as structured fields | `variant_dict` and `group_id` are API only | Conversions API |
| Account for returns | There is no return or refund event in the taxonomy | Interim custom server event or offline adjustment; raise as product feedback |
| Measure offline or in-store sales | No browser | API with `action_source` offline or physical_store |
| Track app installs and opens | Not supported by the pixel | API with `action_source` mobile_app, or a measurement partner |
| Send events after the fact | Fires in the moment only | API accepts events up to 7 days old |

**Platform note:** on Shopify, store scripts do not run on the checkout pages, so purchase tracking there goes through Shopify's customer events or server-side. A major Shopify tracking vendor already ships built-in OpenAI pixel support, which makes it a configuration change rather than an engineering project for Shopify brands.

**Hybrid setup (illustrative sample, not executed; the API key lives only on Nano Motion's server):**

```json
{
  "id": "NM-MGN4X2Q1-7F3A9C21",
  "type": "order_created",
  "timestamp_ms": 1791552000000,
  "oppref": "<captured from the landing URL; the API does not capture it automatically>",
  "source_url": "https://<site>/confirmation.html",
  "action_source": "web",
  "user": { "obref": "<from the __obref cookie, unhashed>", "emails_sha256": ["<hash>"] },
  "data": {
    "type": "contents", "amount": 27200, "currency": "USD",
    "contents": [
      { "id": "NM-RJ-01", "quantity": 2, "amount": 9800, "variant_dict": { "size": "M", "color": "black" } },
      { "id": "NM-SK-02", "quantity": 1, "amount": 1800 },
      { "id": "NM-TS-04", "quantity": 1, "amount": 5800 }
    ]
  }
}
```

No engineering capacity? OpenAI's Hightouch, Tealium and LiveRamp integrations can send server events from existing systems.

## 9. Launch checklist (beyond this site)

- Complete business verification before launch, so serving is not throttled.
- Tag every ad URL with UTM parameters (`utm_source=chatgpt&utm_medium=paid&utm_campaign=...`) so Nano Motion's own analytics credits ChatGPT instead of reporting it as direct traffic.
- Validate every event, not just purchases, in debug mode and the Network tab on day one. A linked conversion event is not proof that it fires.
- Turn `debug` off in production; it logs to the console for every visitor. It is on here so reviewers can see SDK activity.
- After 4 to 6 weeks of spend, run a geo-based incrementality test. People research in a conversation and buy later, so click attribution likely under-counts ChatGPT; a lift test gives a causal number finance trusts.

## 10. How it is built

```
index.html          Home: hero, new arrivals, "tested by" athletes
shop.html           All products with category filters
product.html        PDP trust stack: rating, fit meter, model size, size guide,
                    sold-out size with back-in-stock, review summary, complete the kit
fit-finder.html     3 questions: how you train, fit preference, usual size
cart.html           Bag with free-shipping progress
checkout.html       Guest checkout, hashed matching, order creation
confirmation.html   order_created, once
membership.html     Nano Motion Club: free trial or paid monthly
account.html        Account signup (separate from the Club on purpose)
privacy.html        Privacy notice: what is sent, cookies, choices
assets/products.js  Catalog and markets; prices in minor units per market
assets/store.js     Cart, market, consent state, orders (localStorage)
assets/tracking.js  The only file that calls oaiq
assets/consent.js   Opt-in banner, permanent privacy settings panel, toggle and SDK consent calls
assets/eventlog.js  Demo event log (?demo=1)
assets/layout.js    Header, footer, market selector, page_viewed
assets/pages/*.js   Page logic, one file per page (keeps inline scripts out for the CSP)
vercel.json         Security headers and Content Security Policy
```

**`tracking.js` owns browser pixel calls:** consent gating, minor-unit amounts, `contents[]` with variant IDs, event IDs and the fire-once guard, normalization and hashing, and demo logging. Its `sent` log status means **dispatched to the SDK**, not confirmed processed or attributed. Keep server-side conversion delivery, authenticated ingestion diagnostics, and attribution reporting outside this browser file. No server-side validation or attribution polling is required for this reference implementation.

**Head snippet, identical on every page, top of `<head>`:** decide consent → load the SDK → `oaiq('consent', false)` if needed → `oaiq('init', ...)` with stored hashes. Preconnect to `bzrcdn.openai.com`. If Nano Motion's real site has a Content Security Policy, add `https://bzrcdn.openai.com` to `script-src` and `connect-src`, and `https://bzr.openai.com` to `connect-src` and `img-src`.

## 11. Verification

The site was tested end to end in headless Chromium with every `oaiq` call recorded, served with the production security headers. 62 checks pass, including:

- Pixel ID on every page; `page_viewed` once per load in the documented shape
- `items_added` 9800 USD with variant ID; kit add sends one event with 3 items
- `checkout_started` and `order_created` totals equal the sum of their lines
- `order_created` carries the order ID as `event_id`; a refresh does not resend it
- Email, phone and name hashes match independently computed SHA-256 values; the phone hash matches OpenAI's documented example
- No raw email, phone or name in any call or in storage
- Germany: `consent false` set before `init`, banner shown, nothing sent until accept, then `items_added` 8900 EUR
- UK decline: nothing sent after navigation
- Global Privacy Control (US): `consent false` before `init`, nothing sent, GPC lock shown in the unified privacy settings panel and an entry in the demo log
- Japan: ¥14,800 sent as `14800`
- Phone numbers typed in national format get the right country code (US, UK, Germany, Japan)
- 2,000 generated order IDs, all unique
- A kit never adds a sold-out size; the Fit Finder never recommends one
- Without consent, identifiers are not hashed, stored or sent; declining deletes stored hashes
- Zero Content Security Policy violations on all 10 pages
- No JavaScript errors on any page; no horizontal scroll on a 390px phone
- Accessibility scan (axe-core): no violations on any page

**Verification boundaries (October 12):** Live DevTools checks observed HTTP `202 Accepted` for all 12 event types. This confirms an HTTP acknowledgment from the receiving endpoint; it does **not** establish downstream processing, attribution, or reporting. The 62 automated checks cover implementation behavior, not downstream attribution. Receipt diagnostics (e.g., recent-events monitoring, if available) and attributed reporting belong in separate QA/reporting workflows, not in `assets/tracking.js`.

**Run it locally:** `python3 -m http.server 8000` in this folder, then open `http://localhost:8000/?demo=1`. Use a local server, not a double-clicked file: browser hashing needs a secure context, and localhost counts.

**Sources:** OpenAI developer docs: [Measurement Pixel](https://developers.openai.com/ads/measurement-pixel), [Supported Events](https://developers.openai.com/ads/supported-events), [Conversion Tracking](https://developers.openai.com/ads/conversion-tracking), [Conversions API](https://developers.openai.com/ads/conversions-api), [Multiple Pixel IDs](https://developers.openai.com/ads/multiple-pixels).
