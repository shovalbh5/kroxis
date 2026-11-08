import LegalPage from './LegalPage';

export default function Terms() {
  return (
    <LegalPage title="Terms of use" updated="8 November 2026">
      <h2>What Portolan is</h2>
      <p>Portolan gives online sellers regulatory information about their products: which rules may apply, what marketplaces usually ask for, and what documents to check. It is built from official sources and checked by people.</p>
      <h2>What Portolan is not</h2>
      <ul>
        <li>It is not legal advice and does not create a lawyer–client relationship.</li>
        <li>It does not test, certify or approve any product, and it is not a testing laboratory or a customs broker.</li>
        <li>It does not guarantee that a marketplace, regulator or customs authority will accept a product, a listing or a document.</li>
      </ul>
      <p>Decisions about your products, listings and filings stay yours. For a binding opinion, ask a qualified lawyer or an accredited laboratory.</p>
      <h2>Your information</h2>
      <p>Answers depend on what you tell us. If a product description, document or notice is incomplete or wrong, the result can be wrong too. Unknown facts are returned to you as questions.</p>
      <h2>Liability</h2>
      <p>To the extent the law allows, Portolan's liability for any request is limited to the amount you paid for it.</p>
      <h2>Contact</h2>
      <p>Questions about these terms: <span className="pt-select">support@kroxis.com</span></p>
    </LegalPage>
  );
}
