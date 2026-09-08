# Momnagi TikTok Shop Launch Playbook

Prepared 2026-09-08. Full interactive version (stat tiles, checklist,
content pillars) published as a Claude Artifact and shared with the team;
this file is the durable, version-controlled reference.

## Where Momnagi stands today

Pulled from the connected Amazon sales feed (2026-06-11 – 2026-09-01) and
the live Shopify catalog:

- Amazon net margin over the 83-day window: **-1.4%** ($2,638.68 revenue,
  -$37.98 net profit).
- **83.4%** of Amazon revenue is consumed by referral + FBA fees
  ($2,200.35 of $2,638.68).
- **17 straight days** (Aug 15-31) of $0 Amazon revenue while still paying
  $489.52 in fees.
- ASIN `B0BXB947JS` carries **819 days** of stock on hand — flagged
  overstock by the pricing-recommendation signal.
- 7 active Shopify SKUs; only the **Silicone Scar Tape Roll** carries real
  inventory (200 units). Everything else shows 0 on hand.
- No TikTok Shop Seller Center account exists yet — this is a clean start.

## Why TikTok Shop, why now

1. Amazon is currently break-even-to-negative and single-threaded — reason
   enough to build a second demand channel, not to abandon Amazon.
2. The new Shopify maternity/postpartum line (belly band, milk collector,
   scar tape, sink bather) is exactly the candid, low-glam, high-trust
   content category that performs on TikTok's For You feed, and it suits a
   self-produced AI-video workflow.
3. Real inventory is sitting idle on both platforms — 819 days of stock on
   one Amazon ASIN, 200 units of Scar Tape Roll on Shopify — and TikTok
   Shop's in-feed checkout is built to move exactly this kind of
   impulse-adjacent, self-care product.

## Decision needed: which product leads?

**Recommendation: lead with the Silicone Scar Tape Roll; hold the two
Amazon ASINs for a later phase.** It's the only SKU with real, sellable
stock, the C-section/scar-recovery niche already has a built-in trusted
audience on TikTok, and it lets the whole TikTok Shop motion (account,
catalog, content, checkout) get tested without touching the Amazon
listings. Open item: `B0BXB947JS` and `B0CF418Y8H` don't carry product
titles in the connected sales data and don't map cleanly to a current
Shopify listing — confirm what they actually are before cross-listing
either one.

## Catalog readiness

| Product | Price | Stock | TikTok readiness |
|---|---|---|---|
| Silicone Scar Tape Roll | $18.99-$28.99 | 200 units | Ready — Phase 1 |
| C-Section Scar Strips 10-Pack | $25.55 | 0 units | Restock first |
| Wearable Breast Milk Collector | $15.99-$25.99 | 0 units | Restock first |
| Maternity Belly Band | $49.00 | 0 units | Restock first |
| Sink Bather — Foldable Insert | $45.99 | 0 units | Restock first |
| Baby Bath Support Cushion | $22.99 | 0 units | Tagged "coming soon" |
| ASIN B0BXB947JS (Amazon) | ~$19.99 | 819 days cover | Confirm identity first |
| ASIN B0CF418Y8H (Amazon) | ~$19.99 | unknown | Confirm identity first |

## Fulfillment — ship from the Amazon warehouses you already pay for

Amazon can be the shipping company. TikTok Shop officially added
**Multi-Channel Fulfillment (MCF)** as a supported fulfillment method in
February 2026, with setup guidance published August 6, 2026 — so the
819-day overstock ASIN can fulfill TikTok Shop orders directly instead of
sitting idle. ([myamazonguy.com](https://myamazonguy.com/news/tiktok-shop-amazon-integration/),
[supplychain.amazon.com](https://supplychain.amazon.com/learn/amazon-mcf-for-tiktok-shop))

There's no native, one-click connection — it runs through a middleware app
that syncs TikTok Shop orders into Seller Central for MCF to pick, pack,
and ship. TikTok's guidance names nine supported connectors: **Pipe17,
Rithum, WebBee, CedCommerce, ChannelEngine, Order Desk, Lingxing, 4Seller
ERP, and GeekSeller.** CedCommerce and GeekSeller are generally worth
starting evaluation with for a single-brand, low-SKU setup — confirm
current pricing directly.
([relevantaudience.com](https://www.relevantaudience.com/ecommerce-marketing/amazon-mcf-tiktok-shop-nine-apps/))

- Standard MCF delivery: 3 business days (2-day expedited available),
  97%+ on-time, 99.98% undamaged, 100% tracking coverage — meets TikTok
  Shop's delivery-SLA bar.
- Eligible sellers may get up to a 15% MCF fee discount and up to $1 FBA
  credit per unit shipped — check eligibility in Seller Central.
- TikTok's mandatory "Fulfilled by TikTok" (FBT) requirement is currently
  **paused** — MCF stays valid for now, but re-check before scaling
  volume, since the policy has moved before.
  ([easyship.com](https://www.easyship.com/blog/tiktok-shop-reverses-us-shipping-mandate))
- Before going live, check the MCF packaging setting — confirm whether
  Amazon-branded packaging can be turned off. A TikTok Shop customer
  unboxing an Amazon-branded box works against the DTC brand experience
  this plan is built on.

**Fulfillment setup checklist**
- [ ] Evaluate 1-2 connector apps (start with CedCommerce or GeekSeller)
      to sync TikTok Shop orders into Amazon MCF.
- [ ] Check the MCF packaging setting before going live.
- [ ] Confirm FBT-mandate status hasn't changed before scaling volume.

## Foundation checklist

**Account & compliance**
- [ ] Register a TikTok Shop Seller Center account under Momnagi's US
      business entity (EIN/business docs, bank account, return address).
- [ ] Complete business verification and submit ID/bank details first —
      it gates everything else and can take a few days.
- [ ] Install the TikTok sales channel from the Shopify App Store and
      connect momnagi.com to sync catalog, inventory, and orders.
- [ ] Set shipping templates, processing time, and return policy to match
      momnagi.com, in the brand's calm, plain-spoken tone.

**Catalog**
- [ ] Publish the Scar Tape Roll listing with TikTok-native title,
      bullets, and vertical (3:4 / 9:16) images.
- [ ] Write compliance-safe copy — "medical-grade silicone," "tested" —
      no clinical or diagnostic claims.
- [ ] Confirm the two Amazon ASINs' true identity before deciding whether
      to cross-list them.

**Content readiness**
- [ ] Film and hold 5 launch-ready AI videos before flipping the Shop
      live — an empty-looking Shop tab reads as abandoned.
- [ ] Turn on TikTok's AI-generated content label for every AI-produced
      video before it's required to catch a policy violation.

## The AI video content engine

Content model: self-produced AI-generated video (no ad budget, no creator
budget committed yet). Five pillars, 4-5 new videos/week, each cut into
2-3 hook/caption variants:

1. **Problem → relief demo** — the exact moment the product solves the
   discomfort. *"Nobody tells you the incision is the easy part."*
2. **Gentle myth-busting** — correct a misconception in plain language,
   backed by a specific, never alarmist or diagnostic. *"Your scar
   doesn't need air to heal. It needs this."*
3. **Day-in-the-life, POV** — one honest recovery-day moment, not a
   highlight reel. *"Day 6 postpartum, and this is what actually got me
   through it."*
4. **Material close-up** — texture, stretch, cut-to-fit; captions carry
   the video. *"Cut it to your scar. Not the other way around."*
5. **Before / after, restrained** — timeline-based and factual, framed as
   "what I noticed," never "what it treats." *"Week 1 vs. week 6. No
   filter, just the tape."*

**Compliance — read before posting:** TikTok's content policy requires
AI-generated or AI-edited content to be disclosed via its built-in
AI-content label; turn it on for every upload made this way. Never present
an AI avatar as a genuine customer testimonial — frame videos as brand-made
education and demonstration. This also matches Momnagi's own voice rule:
reassure through specifics, never through claims that sound like someone
else's real experience.

## Production help — hiring cheap

What this role needs is fluency in AI generation tools (an avatar tool like
HeyGen, a generative video tool like Kling/Runway/Pika, CapCut for editing,
Midjourney or similar for stills), not camera or lighting skill.

- **Per-video, low commitment:** Fiverr — fixed price per finished
  AI-UGC-style video, gig-based, easy to test 2-3 sellers before
  committing. AI UGC creators on Upwork run roughly $25-55/hr; general
  editors range $15-150+/hr depending on seniority.
  ([upwork.com](https://www.upwork.com/hire/ai-ugc-creators/))
- **Ongoing, best value at 4-5 videos/week:** a dedicated VA (e.g. via
  OnlineJobs.ph) skilled in CapCut/Canva AI/Kling at an hourly rate —
  cheaper than per-gig pricing once volume is steady.

Search "AI UGC creator" or "AI video ads" rather than "video editor" —
that's the actual skill set this pipeline needs. Brief them with the five
content pillars above, the AI-label requirement, and Momnagi's brand voice
(gentle, specific, never clinical or alarmist).

## Distribution — three layers, one funded today

| Layer | What | Cost |
|---|---|---|
| 1. Organic Shop tab & For You | Every AI video, tagged to the live product | Time only |
| 2. Affiliate / Collab Center | Open the listing to creators at a set commission | Commission on sales only |
| 3. Paid Shop Ads / GMV Max | Spend behind a proven winner from Layer 1 | Ad budget — Phase 2, not funded yet |

## 30 / 60 / 90

**Days 1-30 — Foundation & first launch**
Seller Center verified, Shopify channel connected, Scar Tape Roll listed
with compliant copy, 15-20 AI videos posted, Collab Center opened at a
starting commission rate.

**Days 31-60 — Signal & iterate**
Identify the best-performing hook/pillar from analytics and double down;
add C-Section Scar Strips once Shopify stock allows; compare TikTok's true
take-rate against the Amazon baseline below.

**Days 61-90 — Scale decision point**
Decide on Layer 3 paid spend backed by real CTR data; revisit cross-listing
the Amazon ASINs to work off the overstock; confirm whether Scar Tape Roll
stays the lead SKU.

## Economics side by side

**Amazon — actual, last 83 days:** $2,638.68 revenue, $2,200.35 (83.4%)
referral + FBA fees, $422.40 COGS, -$37.98 net profit.

**TikTok Shop — structure, not a promise:** category referral commission
(set per category), payment processing per transaction, no storage/
long-term fees if self-fulfilled, seller-set optional affiliate commission.
Confirm the current rates for Momnagi's categories inside Seller Center
during onboarding rather than assuming figures here — they're set per
category and change over time.

## What to watch, weekly

- Videos posted vs. the 4-5/week target
- Average watch-through percentage per pillar
- Shop-tab click rate from video
- Units sold — organic video vs. Collab Center
- Orders per video, first 48 hours after posting
- Contribution margin per unit after TikTok fees + any commission
- Scar Tape Roll days-of-stock remaining (of 200 units)
- AI-content label applied — 100% compliance, checked weekly

---

The lead-product call above is a recommendation, not a final decision —
update this file once it's confirmed.
