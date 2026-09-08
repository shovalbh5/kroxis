# Momnagi Multi-Channel Playbook

Prepared 2026-09-08. Full interactive version (stat tiles, checklist,
content pillars) published as a Claude Artifact and shared with the team;
this file is the durable, version-controlled reference. Amazon, Shopify,
and TikTok Shop are worked as three parallel tracks here, not sequenced
one after another.

## Where Momnagi stands today

Pulled from the connected Amazon sales/inventory feed (2026-06-11 –
2026-09-02) and the live Shopify catalog:

- Amazon net margin over the 83-day window: **-1.4%** ($2,638.68 revenue,
  -$37.98 net profit).
- **17 straight days** (Aug 15-31) of $0 Amazon revenue while still paying
  $489.52 in fees.
- **14 of 18** Amazon ASINs sit at 0 fulfillable units despite carrying
  real stock (200-500 units each) — stuck inbound, not yet receivable.
- ASIN `B0BXB947JS` carries **819 days** of stock on hand — flagged
  overstock, and it's the one ASIN with an ongoing sales history.
- 7 active Shopify SKUs; only the **Silicone Scar Tape Roll** carries real
  on-hand inventory (200 units). Everything else shows 0 on hand.
- No TikTok Shop Seller Center account exists yet — this is a clean start.

## The finding that changes the plan

Amazon's inventory feed shows 14 of 18 ASINs carrying real inbound stock —
200 to 500 units each, covering all four scar tape variants, the belly
band in every size, both milk collector counts, the C-section strips, the
sink bather, the baby bath cushion, and the original crib liner (SKU
`MN-CRIB-W2`) — that has never converted to fulfillable. It's sitting in
Amazon's receiving pipeline, and the same SKUs show 0 on hand on Shopify
too. **This is one shared blocker across every channel, not three
separate inventory problems**, and it's the thing to unblock before the
channel-specific work below matters much.

It also explains the Aug 15-31 dead zone: ASIN `B0CF418Y8H` genuinely ran
out (1 unit on Aug 11, 0 by Aug 14), while `B0BXB947JS` still had 52-92
units on hand the whole time but its daily sales velocity collapsed from
~1.1-1.7/day to ~0.14/day in that exact window — worth a Seller Central
check for a Buy Box or listing-health issue, separate from the stock
question.

## Why now, and why in parallel

1. Amazon is currently break-even-to-negative and single-threaded — reason
   enough to build a second demand channel, not to abandon Amazon.
2. The three channels aren't competing for the same hours. Getting inbound
   FBA stock checked in, syncing it to Shopify, and setting up a TikTok
   Shop account are three different kinds of work — admin, catalog, and
   content — that don't block each other. Running them at once instead of
   "Amazon first, then Shopify, then TikTok" gets Momnagi selling
   everywhere sooner.
3. The new Shopify maternity/postpartum line (belly band, milk collector,
   scar tape, sink bather) is exactly the candid, low-glam, high-trust
   content category that performs on TikTok's For You feed, and it suits a
   self-produced AI-video workflow.

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

## 30 / 60 / 90 — three tracks, run at once

Each phase happens across Amazon, Shopify, and TikTok Shop in the same
window — not one channel after another.

**Days 1-30 — Unblock & launch**
- *Inventory:* get the highest-priority inbound ASINs checked in at
  Amazon; sync received units to Shopify.
- *Amazon:* check `B0BXB947JS` for a Buy Box / listing-health issue behind
  the velocity drop; reorder `B0CF418Y8H`.
- *Shopify:* resolve Scar Tape Roll's price review; get first received
  SKUs live on-site.
- *TikTok:* Seller Center verified, Shopify channel connected, Scar Tape
  Roll listed, 15-20 AI videos posted.

**Days 31-60 — Signal & iterate**
- *Inventory:* remaining inbound ASINs received; Shopify catalog reflects
  real stock across all 7 SKUs.
- *Amazon:* evaluate an MCF connector (CedCommerce or GeekSeller) once its
  inventory is fulfillable.
- *Shopify:* add restocked SKUs (belly band, milk collector) to the DTC
  storefront.
- *TikTok:* double down on the best-performing hook/pillar; open Collab
  Center; add C-Section Scar Strips.

**Days 61-90 — Scale decision point**
- *Amazon:* route the 819-day overstock ASIN into TikTok Shop fulfillment
  via MCF once confirmed and connected.
- *Shopify:* full 7-SKU catalog live, feeding all three channels from one
  inventory pool.
- *TikTok:* decide on Layer 3 paid spend backed by real CTR data; confirm
  whether Scar Tape Roll stays the lead SKU.
- *Content:* reuse the same AI videos on Instagram Reels / YouTube Shorts
  once a format is proven — zero extra production cost.

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
