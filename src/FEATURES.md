# KROXIS E-Commerce Platform - Feature Documentation

## 🎯 Overview

KROXIS is a high-performance, Shopify-level e-commerce platform for professional safety eyewear, built with industrial luxury design and enterprise-grade features.

---

## 📋 Feature Breakdown

### 1️⃣ SEO & Content Logic

#### ✅ Automated SEO Generation
- **Product Pages**: Auto-generated meta titles, descriptions, and structured data (JSON-LD)
- **Collection Pages**: Dynamic SEO based on category/filters
- **Blog Posts**: Full SEO meta tags with Open Graph and Twitter Cards
- **Implementation**: `/utils/seo.js` - Functions: `generateProductSEO()`, `generateCollectionSEO()`, `generateBlogSEO()`, `applySEO()`

#### ✅ Blog Engine (Work-Safety Insights)
- **Features**:
  - Full markdown support with ReactMarkdown
  - Tag-based filtering and search
  - Related product cross-promotion
  - Author attribution and publishing workflow
- **Routes**: `/blog` (listing), `/blog/:slug` (article)
- **Entity**: `BlogPost` with fields: title, slug, content, tags, related_products, meta_title, meta_description, published_date
- **Sample Content**: 2 pre-loaded articles on ANSI standards and construction safety

---

### 2️⃣ Advanced Marketing & Conversion

#### ✅ Exit-Intent Popup
- **Trigger**: Mouse leaves browser window (top edge)
- **Offer**: 10% discount code (`KROXIS10`)
- **Behavior**: Shows once per session (sessionStorage)
- **Component**: `components/marketing/ExitIntentPopup.jsx`
- **Storage**: Saves email and discount code to localStorage

#### ✅ Dynamic Upsell Logic
- **Trigger**: After adding product to cart
- **Display**: Modal with 3 relevant accessories (hard case, cleaning kit, lens replacement)
- **Logic**: Industry-specific recommendations based on product category
- **Component**: `components/marketing/UpsellModal.jsx`
- **Integration**: Built into ProductDetail page

#### ✅ Abandoned Cart Webhook
- **Tracking**: Captures checkout initiation data (items, customer info, session)
- **Webhook**: Sends payload to external CRM after 45 minutes
- **Entity**: `AbandonedCart` with recovery URL and tracking fields
- **Backend Function**: `functions/trackAbandonedCart.js`
- **Environment Variable**: `ABANDONED_CART_WEBHOOK_URL` for CRM integration

---

### 3️⃣ Operations & Logistics

#### ✅ Multi-Language Support (English + Hebrew RTL)
- **Implementation**: Full i18n with `LanguageContext`
- **URL Structure**: `/` (English), `/he` (Hebrew)
- **Features**:
  - Automatic RTL layout switching
  - Localized navigation and content
  - URL-based language detection
- **Toggle**: Globe icon in header to switch languages
- **Context**: `context/LanguageContext.jsx`

#### ✅ Smart Shipping Logic
- **Free Shipping**: Orders over $150 (configurable threshold)
- **Flat Rate**: $9.99 domestic, $24.99 international
- **Real-time Carrier API**: ShipEngine integration support
- **Backend Function**: `functions/calculateShipping.js`
- **Environment Variable**: `SHIPENGINE_API_KEY` (optional)

#### ✅ Tax Calculation
- **US Sales Tax**: State-level rates (50 states)
- **International VAT**: 15+ countries supported
- **Third-party Integration**: TaxJar API support
- **Backend Function**: `functions/calculateTax.js`
- **Environment Variable**: `TAXJAR_API_KEY` (optional)

---

### 4️⃣ Retention & B2B Features

#### ✅ Wholesale Portal
- **Route**: `/wholesale` (hidden from main nav)
- **Features**:
  - Dynamic bulk pricing tiers (Bronze 10%, Silver 15%, Gold 20%, Platinum 25%)
  - Real-time discount calculation
  - Quote request workflow
  - Industry-specific volume tracking
- **Entity**: `WholesaleRequest` for B2B lead capture
- **Page**: `pages/Wholesale.jsx`

#### ✅ Product Recommendation Engine
- **Frequently Bought Together**: Up to 3 related products on PDP
- **Logic**: Category-based + manual selection
- **Component**: `components/products/FrequentlyBoughtTogether.jsx`
- **Features**: Multi-select with dynamic total calculation

#### ✅ Review System
- **Features**:
  - 5-star rating with distribution chart
  - Photo upload (via Base44 UploadFile integration)
  - Verified purchase badges
  - Helpful votes
  - Moderation workflow (pending/approved/rejected)
- **Entity**: `Review` with status field
- **Component**: `components/products/ReviewSection.jsx`
- **Integration**: Full CRUD with Base44 SDK

---

### 5️⃣ Performance & Technical

#### ✅ Lazy Loading & Image Optimization
- **WebP Format**: Automatic conversion with fallback
- **Lazy Loading**: Intersection Observer for below-the-fold images
- **Responsive Images**: srcset generation for multiple device sizes
- **Component**: `components/ui/OptimizedImage.jsx`
- **Utilities**: `utils/imageOptimization.js`
- **Functions**: `generateSrcSet()`, `toWebP()`, `lazyLoadImages()`, `getOptimalImageSize()`

#### ✅ PWA Capability
- **Manifest**: `/public/manifest.json` with app metadata
- **Service Worker**: `/public/sw.js` for offline caching
- **Install Prompt**: "Add to Home Screen" button
- **Features**:
  - Offline product browsing
  - App shortcuts (Shop, Orders)
  - Standalone display mode
  - Update notifications
- **Setup**: `utils/pwaSetup.js` - Auto-initialized in main.jsx

---

## 🗄️ Database Schema

### Core Entities
- **Product**: Full e-commerce product with variants, certifications, B2B pricing
- **Order**: Complete order tracking with line items, shipping, status
- **CartItem**: Anonymous + authenticated cart support
- **Prescription**: Prescription data capture for Rx-ready products

### Content & Marketing
- **BlogPost**: Full CMS with tags, SEO, related products
- **Review**: Customer reviews with photos and moderation
- **AbandonedCart**: Cart recovery tracking and webhook integration
- **WholesaleRequest**: B2B lead capture and tier assignment

---

## 🔧 Backend Functions

| Function | Purpose | Environment Variables |
|----------|---------|----------------------|
| `trackAbandonedCart.js` | Capture abandoned checkouts, send to CRM | `ABANDONED_CART_WEBHOOK_URL` |
| `calculateShipping.js` | Smart shipping rates + carrier API | `SHIPENGINE_API_KEY` (optional) |
| `calculateTax.js` | US sales tax + international VAT | `TAXJAR_API_KEY` (optional) |

---

## 🎨 Design System

- **Typography**: Oswald (headings), Inter (body)
- **Colors**: 
  - Primary: Safety Orange (`#FF8800` / `hsl(30 100% 50%)`)
  - Secondary: Dark Charcoal (`#1C1C1C` / `hsl(0 0% 11%)`)
- **Components**: Full shadcn/ui library + custom KROXIS components
- **Responsive**: Mobile-first with Tailwind breakpoints
- **Animations**: Framer Motion for micro-interactions

---

## 📱 Routes

### Public Routes
- `/` - Homepage with hero, featured carousel, industry grid
- `/shop` - Product catalog with filters
- `/product/:id` - Product detail with configurator, reviews, upsells
- `/checkout` - Checkout flow with shipping/tax calculation
- `/blog` - Blog listing with search and tags
- `/blog/:slug` - Article page with related products
- `/wholesale` - B2B wholesale portal

### Multi-Language Routes
All routes duplicated with `/he` prefix for Hebrew (RTL)

---

## 🚀 Performance Features

1. **Code Splitting**: Dynamic imports for routes
2. **Image Optimization**: WebP + lazy loading + responsive srcset
3. **PWA**: Service worker caching for offline access
4. **CDN-Ready**: Static asset optimization
5. **Analytics Integration**: Custom event tracking with Base44 SDK

---

## 🔐 Security Features

1. **Authentication**: Base44 built-in auth (optional for public store)
2. **Input Validation**: Form validation with react-hook-form + Zod
3. **HTTPS Only**: Force secure connections in production
4. **Environment Variables**: Secrets management for API keys
5. **Rate Limiting**: Backend function throttling

---

## 📊 Analytics & Tracking

- **Abandoned Cart Recovery**: Automatic tracking + CRM webhook
- **Exit Intent**: Email capture for discount campaigns
- **Product Views**: SEO structured data for rich snippets
- **Conversion Tracking**: Add-to-cart, checkout, upsell acceptance
- **Custom Events**: Base44 analytics SDK integration

---

## 🛠️ Development Setup

### Required Environment Variables
```bash
# Optional - Enhanced Features
ABANDONED_CART_WEBHOOK_URL=https://your-crm.com/webhook
SHIPENGINE_API_KEY=your_shipengine_key
TAXJAR_API_KEY=your_taxjar_key
```

### Installation
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

---

## 📦 Dependencies

### Core
- React 18 + React Router v6
- TanStack Query (React Query) for data fetching
- Tailwind CSS + shadcn/ui components
- Framer Motion for animations

### Features
- react-markdown (blog content)
- date-fns (date formatting)
- lucide-react (icons)
- Base44 SDK (@base44/sdk)

---

## 🎓 Usage Examples

### Adding a New Blog Post
```javascript
await base44.entities.BlogPost.create({
  title: 'Your Article Title',
  slug: 'your-article-slug',
  content: '# Markdown content here...',
  excerpt: 'Short summary',
  tags: ['Safety', 'Construction'],
  related_products: ['product_id_1', 'product_id_2'],
  is_published: true,
  published_date: new Date().toISOString()
});
```

### Tracking Abandoned Cart
```javascript
await base44.functions.invoke('trackAbandonedCart', {
  cartData: { items, sessionId },
  customerEmail: 'user@example.com',
  customerName: 'John Doe'
});
```

### Calculating Shipping
```javascript
const shipping = await base44.functions.invoke('calculateShipping', {
  items: cartItems,
  destination: { country: 'US', state: 'CA', zip: '90001' }
});
```

---

## 🎯 Future Enhancements

- [ ] Live chat support integration
- [ ] Subscription box for safety supplies
- [ ] AR try-on with WebXR
- [ ] Loyalty points program
- [ ] Multi-currency support
- [ ] Advanced A/B testing framework

---

## 📞 Support

For technical questions or feature requests, contact the KROXIS development team.

**Built with ❤️ for industrial workers worldwide.**