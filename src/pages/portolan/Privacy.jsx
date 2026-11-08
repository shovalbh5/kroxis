import LegalPage from './LegalPage';

export default function Privacy() {
  return (
    <LegalPage title="Privacy" updated="8 November 2026">
      <h2>What we collect</h2>
      <p>When you send a request we keep what you type into the form: your email, and if you add them, your name, company, marketplace, product description and any notice text you paste.</p>
      <h2>Why</h2>
      <p>Only to answer your request and to follow up about it. We do not sell your information or share it with advertisers.</p>
      <h2>Where it is kept</h2>
      <p>Requests are stored by our website provider (Base44). Product details may be processed by an AI service to prepare your answer.</p>
      <h2>Your choices</h2>
      <p>Ask us at any time to see or delete what we hold about you: <span className="pt-select">support@kroxis.com</span></p>
    </LegalPage>
  );
}
