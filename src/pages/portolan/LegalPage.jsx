import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import './portolan.css';

// Shared shell for the short legal pages (terms, privacy).
export default function LegalPage({ title, updated, children }) {
  useEffect(() => { document.title = `${title} · Portolan`; window.scrollTo(0, 0); }, [title]);
  return (
    <div className="pt-root pt-legal">
      <header className="pt-legal-head">
        <Link to="/" className="pt-wordmark">Portolan</Link>
      </header>
      <main id="main-content" className="pt-legal-body">
        <h1>{title}</h1>
        <p className="pt-muted">Last updated {updated}. This page is a working draft pending review by a lawyer.</p>
        {children}
        <p className="pt-legal-back"><Link to="/">Back to Portolan</Link></p>
      </main>
    </div>
  );
}
