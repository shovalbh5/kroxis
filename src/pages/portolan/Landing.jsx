import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import './portolan.css';

const CONTACT = 'support@kroxis.com';

// Facts below come from the Portolan knowledge base and research files (MILLION-CO).
const NUMBERS = [
  ['295', 'rules from official sources'],
  ['4', 'regions: US, EU, UK, Canada'],
  ['12', 'sales channels, Amazon first'],
  ['361', 'CPSC-accepted labs mapped'],
];

const OFFERS = [
  {
    id: 'notice_triage',
    title: 'Notice triage',
    price: 'Free during the pilot',
    blurb: 'Paste the compliance notice from Amazon. You get back what it is really asking for and a draft reply.',
    points: [
      'What the notice asks for, in plain words',
      'A check for misclassification (is your product really in that category?)',
      'Which of your documents and listing fields match the request',
      'A draft reply you can edit and send',
    ],
    replaces: 'Reinstatement agencies can charge $1,000–3,500 for this. We show what is being asked. We do not promise reinstatement.',
    cta: 'Paste a notice',
  },
  {
    id: 'document_check',
    title: 'Supplier document check',
    price: '$49 · nothing to pay if we find no problem',
    blurb: 'Send the test reports and certificates your supplier gave you. We compare them with your actual product.',
    points: [
      'Reads test reports, CPC / GCC certificates and declarations',
      'Finds mismatches: wrong model, wrong standard, wrong age grade, expired lab',
      'Shows the evidence for every finding',
      'Never "approves" a document: it tells you what to fix or ask for',
    ],
    replaces: 'Manual CPC reviews usually take about a week.',
    cta: 'Check my documents',
  },
  {
    id: 'product_check',
    title: 'Product check report',
    price: 'Pilot · price on request',
    blurb: 'Before you list or launch: one report of the rules that apply to your product in the markets you sell in.',
    points: [
      'Requirements by market and marketplace, each with its source',
      'What you can skip, so you do not pay for tests you do not need',
      'Open questions where we need a fact from you',
      'Accepted labs to ask for a quote when a test is required',
    ],
    replaces: 'Best before you place the factory order, while changes are still cheap.',
    cta: 'Request a report',
  },
];

const STEPS = [
  ['Tell us about the product', 'A description, a listing link or the notice you received. We turn it into a product profile: materials, age grade, intended use, markets.'],
  ['Specialists check it', 'Separate checks for US (CPSC, FDA, FTC, Prop 65), EU, UK and Canada, and marketplace rules. A final reviewer removes anything without a source.'],
  ['You get a sourced answer', 'What applies, what does not, and why. Anything we cannot know from your description comes back to you as a question.'],
];

const COVERAGE = [
  ['United States', 'CPSC: children’s vs general-use products, CPC / GCC, accepted labs, tracking labels, eFiling. FDA (cosmetics under MoCRA, devices vs wellness, food contact), FTC claims and reviews, California Prop 65.'],
  ['European Union', 'GPSR, CE marking, toys, batteries, EPR, REACH and cosmetics, with real Safety Gate cases.'],
  ['UK & Canada', 'UK GPSR, UKCA / CE, CCPSA incident reporting, bilingual labels and products banned in Canada.'],
  ['Marketplaces', 'What Amazon, Walmart, TikTok Shop and nine more channels ask sellers to provide, and how they phrase it in notices.'],
];

const FAQ = [
  ['Is this legal advice?', 'No. Kroxis Portolan gives regulatory information drawn from official sources, with the source shown for every point. It does not replace a lawyer, and it does not create a lawyer–client relationship.'],
  ['Do you test, certify or approve products?', 'No. We are not a laboratory, a certification body or a customs broker. We tell you which requirements likely apply, check whether your documents match your product, and show accepted labs when a test is needed.'],
  ['Why not just ask the lab?', 'A lab tests what you ask it to test. Sellers get blocked when the wrong standard was tested, the model number does not match, or the age grade is off. We help you ask for the right test and check the report against your product.'],
  ['Will this get my listing reinstated?', 'We cannot promise that. The marketplace decides. We show what the notice asks for, what your documents cover and what is missing, so your reply answers the actual request.'],
  ['Do you earn anything from labs?', 'If you choose a lab from our list, the lab may pay us a referral fee. It does not change what you pay, and we list accepted labs whether or not they pay us.'],
  ['What does the document check cost?', 'During the pilot it is $49, and if we find no problem you pay nothing. Notice triage is free during the pilot.'],
  ['Which marketplaces do you cover?', 'Amazon (US, EU, UK, Canada), Walmart, TikTok Shop and nine more sales channels.'],
  ['What happens to what I send you?', 'We use it only to answer your request. We do not sell it or share it with advertisers. See the privacy page.'],
];

function Rose() {
  // A compass rose of 32 rhumb lines, as drawn on portolan charts.
  const lines = useMemo(() => Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    const color = i % 4 === 0 ? 'rgba(226,235,232,.16)' : i % 2 === 0 ? 'rgba(82,192,162,.14)' : 'rgba(240,106,82,.12)';
    return <line key={i} x1="500" y1="500" x2={500 + Math.cos(a) * 520} y2={500 + Math.sin(a) * 520} stroke={color} strokeWidth="1" style={{ animationDelay: `${i * 30}ms` }} />;
  }), []);
  return (
    <svg className="pt-rose" viewBox="0 0 1000 1000" aria-hidden="true">
      <circle cx="500" cy="500" r="190" fill="none" stroke="rgba(148,167,170,.14)" strokeDasharray="2 8" />
      <circle cx="500" cy="500" r="380" fill="none" stroke="rgba(148,167,170,.10)" strokeDasharray="2 8" />
      {lines}
      <g transform="translate(500 500)">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const L = i % 2 ? 26 : 46, w = i % 2 ? 6 : 9;
          return <polygon key={i} transform={`rotate(${i * 45})`} points={`0,-${L} ${w},0 0,0 -${w},0`} fill={i === 0 ? '#F06A52' : 'rgba(226,235,232,.55)'} />;
        })}
      </g>
    </svg>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="none" stroke="#94A7AA" strokeWidth="1" />
      <polygon points="12,2.5 14,12 12,12 10,12" fill="#F06A52" />
      <polygon points="12,21.5 14,12 12,12 10,12" fill="#E2EBE8" />
    </svg>
  );
}

function LeadForm({ offer, setOffer }) {
  const [form, setForm] = useState({ email: '', name: '', marketplace: 'amazon_us', product: '', notice_text: '', consent: false });
  const [state, setState] = useState({ sending: false, done: false, error: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setState({ sending: false, done: false, error: 'Enter a valid email address so we can reply.' }); return; }
    if (!form.consent) { setState({ sending: false, done: false, error: 'Tick the box to agree that we may contact you about this request.' }); return; }
    setState({ sending: true, done: false, error: '' });
    const params = new URLSearchParams(window.location.search);
    try {
      await base44.entities.PortolanLead.create({
        email: form.email.trim(), name: form.name.trim(), offer, marketplace: form.marketplace,
        product: form.product.trim(), notice_text: offer === 'notice_triage' ? form.notice_text.trim() : '',
        consent: true, source: params.get('utm_source') || params.get('ref') || 'kroxis.com', status: 'new',
      });
      setState({ sending: false, done: true, error: '' });
    } catch (err) {
      setState({ sending: false, done: false, error: `We could not send this. Please try again, or email ${CONTACT}.` });
    }
  };

  if (state.done) {
    return (
      <div className="pt-done" role="status">
        <h3>Request received</h3>
        <p className="pt-muted">We will reply to <b>{form.email}</b> by email. For a document check, the reply tells you where to send the reports.</p>
      </div>
    );
  }

  return (
    <form className="pt-form" onSubmit={submit} noValidate>
      <fieldset className="pt-choices">
        <legend className="pt-field"><span>What do you need?</span></legend>
        {OFFERS.map((o) => (
          <label className="pt-choice" key={o.id}>
            <input type="radio" name="offer" id={`offer-${o.id}`} value={o.id} checked={offer === o.id} onChange={() => setOffer(o.id)} />
            <div><b>{o.title}</b><span>{o.price}</span></div>
          </label>
        ))}
      </fieldset>
      <div className="pt-field">
        <label htmlFor="pt-email">Email</label>
        <input id="pt-email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
      </div>
      <div className="pt-field">
        <label htmlFor="pt-name">Name or company <span className="pt-hint">(optional)</span></label>
        <input id="pt-name" type="text" autoComplete="organization" value={form.name} onChange={set('name')} />
      </div>
      <div className="pt-field">
        <label htmlFor="pt-market">Where do you sell?</label>
        <select id="pt-market" value={form.marketplace} onChange={set('marketplace')}>
          <option value="amazon_us">Amazon US</option>
          <option value="amazon_eu">Amazon EU</option>
          <option value="amazon_uk">Amazon UK</option>
          <option value="amazon_ca">Amazon Canada</option>
          <option value="walmart">Walmart</option>
          <option value="tiktok_shop">TikTok Shop</option>
          <option value="shopify">Own store (Shopify or similar)</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="pt-field">
        <label htmlFor="pt-product">The product</label>
        <input id="pt-product" type="text" placeholder="e.g. silicone baby teether, or a listing link" value={form.product} onChange={set('product')} />
      </div>
      {offer === 'notice_triage' && (
        <div className="pt-field">
          <label htmlFor="pt-notice">Paste the notice</label>
          <textarea id="pt-notice" placeholder="Paste the full text of the compliance notice you received" value={form.notice_text} onChange={set('notice_text')} />
          <span className="pt-hint">Remove anything personal you do not want to share. Your seller ID is not needed.</span>
        </div>
      )}
      <label className="pt-consent">
        <input type="checkbox" id="pt-consent" checked={form.consent} onChange={set('consent')} />
        <span>Contact me about this request. I understand Portolan gives regulatory information, not legal advice. <Link to="/privacy">Privacy</Link></span>
      </label>
      {state.error && <p className="pt-error" role="alert">{state.error}</p>}
      <button className="pt-btn pt-btn-main" type="submit" disabled={state.sending}>{state.sending ? 'Sending…' : 'Send request'}</button>
    </form>
  );
}

export default function Landing() {
  const [offer, setOffer] = useState('notice_triage');
  useEffect(() => { document.title = 'Kroxis Portolan · Product compliance for online sellers'; document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr'; }, []);
  const start = (id) => () => { setOffer(id); document.getElementById('start')?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div className="pt-root">
      <header className="pt-head">
        <div className="pt-wrap">
          <a href="#top" className="pt-wordmark"><Mark />Kroxis<span className="pt-wordmark-sub">Portolan</span></a>
          <nav className="pt-nav" aria-label="Main">
            <a href="#offers" className="pt-hide-sm">What we do</a>
            <a href="#how" className="pt-hide-sm">How it works</a>
            <a href="#faq" className="pt-hide-sm">Questions</a>
            <button type="button" className="pt-btn pt-btn-main pt-btn-sm" onClick={start('notice_triage')}>Paste a notice</button>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="pt-hero" id="top">
          <Rose />
          <div className="pt-wrap">
            <span className="pt-eyebrow">Kroxis Portolan · product compliance for online sellers</span>
            <h1>Know what your product needs <em>before</em> you ship it.</h1>
            <p className="pt-tagline">Your markets, charted. Every line, sourced.</p>
            <p className="pt-lede">Kroxis Portolan checks your product against US, EU, UK and Canadian rules and against what Amazon, Walmart and TikTok Shop require. Use it before you place the factory order, or when a listing gets blocked. Anything we cannot know from your description comes back to you as a question.</p>
            <div className="pt-cta-row">
              <button type="button" className="pt-btn pt-btn-main" onClick={start('notice_triage')}>Triage a notice, free</button>
              <button type="button" className="pt-btn pt-btn-ghost" onClick={start('document_check')}>Check supplier documents · $49</button>
            </div>
            <p className="pt-fine">Portolans were sailing charts drawn by sailors who had already made the trip. Regulatory information, not legal advice. We do not promise reinstatement.</p>
            <div className="pt-numbers">
              {NUMBERS.map(([n, label]) => <div key={label}><b>{n}</b><span>{label}</span></div>)}
            </div>
          </div>
        </section>

        <section className="pt-section" id="offers">
          <div className="pt-wrap">
            <h2>Three ways in, depending on where you are</h2>
            <p className="pt-lede">Small importers use it before ordering from the factory, while changes are still cheap. Sellers with a blocked listing use it to see what the marketplace is actually asking for.</p>
            <div className="pt-offers">
              {OFFERS.map((o) => (
                <article className="pt-offer" key={o.id}>
                  <h3>{o.title}</h3>
                  <span className={`pt-price${o.id === 'product_check' ? ' soon' : ''}`}>{o.price}</span>
                  <p>{o.blurb}</p>
                  <ul>{o.points.map((p) => <li key={p}>{p}</li>)}</ul>
                  <button type="button" className="pt-btn pt-btn-ghost" onClick={start(o.id)}>{o.cta}</button>
                  <p className="pt-replaces">{o.replaces}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pt-section" id="how">
          <div className="pt-wrap">
            <h2>How a check works</h2>
            <p className="pt-lede">The rules are read once, from the source, and kept current. Your product is checked against them, not against a guess.</p>
            <ol className="pt-steps">
              {STEPS.map(([t, d]) => <li key={t}><h3>{t}</h3><p>{d}</p></li>)}
            </ol>
          </div>
        </section>

        <section className="pt-section" id="coverage">
          <div className="pt-wrap">
            <h2>What the charts cover</h2>
            <p className="pt-lede">Baby, children’s, cosmetic, battery and household products are where most blocks happen, and where the rules are most detailed.</p>
            <div className="pt-coverage">
              {COVERAGE.map(([r, d]) => <div className="pt-region" key={r}><h3>{r}</h3><p>{d}</p></div>)}
            </div>
          </div>
        </section>

        <section className="pt-section" id="start">
          <div className="pt-wrap pt-form-grid">
            <div>
              <h2>Send your request</h2>
              <p className="pt-lede">Tell us what you need. We reply by email with the answer, or with the questions we need answered first.</p>
              <p className="pt-muted">During the pilot we take a small number of sellers at a time, and a person reviews every answer before it goes out.</p>
            </div>
            <LeadForm offer={offer} setOffer={setOffer} />
          </div>
        </section>

        <section className="pt-section" id="faq">
          <div className="pt-wrap">
            <h2>Questions sellers ask first</h2>
            <div className="pt-faq">
              {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
            </div>
          </div>
        </section>
      </main>

      <footer className="pt-foot">
        <div className="pt-wrap">
          <a href="#top" className="pt-wordmark"><Mark />Kroxis<span className="pt-wordmark-sub">Portolan</span></a>
          <nav aria-label="Footer">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <span>Contact: <span className="pt-select">{CONTACT}</span></span>
          </nav>
          <p className="pt-disclaimer">Kroxis Portolan provides regulatory information for online sellers. It is not legal advice, it does not promise reinstatement of any listing, and it does not test, certify or approve products. Requirements change, so check the cited source before you act.</p>
        </div>
      </footer>
    </div>
  );
}
