import './App.css'

const privacySections = [
  ['Information we collect', 'When you request an appointment, we collect the name and phone number you provide, your selected service or package, preferred date and time, and any optional message. Please do not include sensitive personal information in the message field.'],
  ['How we use appointment information', 'Celestique Beauty Spa uses these details to receive and review appointment requests, check availability, contact you about your request, provide customer support, and maintain relevant business records. Submitting a request does not itself confirm an appointment; confirmation follows after the spa checks availability and responds.'],
  ['Storage and access', 'Appointment records are processed and stored using Supabase cloud services. Access to booking records is restricted through the website’s administrator access controls. We do not publish customer booking details on the public website.'],
  ['WhatsApp and other service providers', 'After submitting a booking request, you may choose to continue on WhatsApp. Only when you choose that link will the prepared appointment message be opened in WhatsApp, which is operated by Meta and is subject to its own privacy practices. The website also loads some fonts from Google Fonts and may load selected images from Unsplash. Those providers may receive technical request information, such as your IP address and browser details, when your browser requests their resources.'],
  ['Browser storage and security', 'The administrator portal uses Supabase authentication, which stores an authentication session in browser storage on the administrator’s device so the administrator can remain signed in. This is browser local storage, not an advertising cookie. Keep administrator devices secure and sign out when using a shared device. We do not intentionally deploy advertising or analytics trackers on this website.'],
  ['Retention and your choices', 'We keep appointment information only for as long as reasonably needed to handle the request, support salon operations, and meet applicable record-keeping obligations. The appropriate retention period may depend on the circumstances. You may request access to, correction of, or deletion of your personal information by contacting us. Some records may need to be retained where a legal or legitimate business requirement applies.'],
  ['Contact and applicable law', 'For privacy questions or requests, contact andayitimothy48@gmail.com. This notice explains the website’s current practices and does not replace your rights under applicable Kenyan data-protection law.']
]

function PrivacyContent() {
  return (
    <>
      <span className="legal-eyebrow">CELESTIQUE BEAUTY SPA · YOUR INFORMATION</span>
      <h1>Privacy Notice</h1>
      <p className="legal-lead">This notice explains what information we handle when you browse our website or request an appointment, why we use it, and how you can contact us about it.</p>
      <p className="legal-updated">Current as of 11 November 2026</p>
      {privacySections.map(([title, body]) => (
        <section className="legal-section" key={title}>
          <h2>{title}</h2>
          <p>{body}</p>
        </section>
      ))}
    </>
  )
}

function CookieContent() {
  return (
    <>
      <span className="legal-eyebrow">CELESTIQUE BEAUTY SPA · WEBSITE TECHNOLOGY</span>
      <h1>Cookie &amp; Browser Storage Notice</h1>
      <p className="legal-lead">We aim to use only the browser technology needed to operate the website and its administrator portal.</p>
      <p className="legal-updated">Current as of 11 November 2026</p>
      <section className="legal-section">
        <h2>Advertising and analytics cookies</h2>
        <p>We do not intentionally use advertising cookies, analytics cookies, or third-party tracking pixels on this website. There is therefore no optional analytics or advertising cookie category to enable through a consent banner at present.</p>
      </section>
      <section className="legal-section">
        <h2>Essential administrator browser storage</h2>
        <p>The administrator portal uses Supabase authentication. When an authorized administrator signs in, the authentication session is stored in that browser’s local storage to maintain the signed-in session. Local storage is a browser storage mechanism; it is not itself a cookie. This storage supports the administrator portal and is not used for advertising.</p>
      </section>
      <section className="legal-section">
        <h2>Third-party website resources</h2>
        <p>Some pages may request font files from Google Fonts and selected image resources from Unsplash. These are resource requests rather than advertising cookies set by Celestique. The providers may receive technical information associated with those requests.</p>
      </section>
      <section className="legal-section">
        <h2>Managing browser storage</h2>
        <p>You can clear website data through your browser settings. Clearing local storage may sign an administrator out and require them to sign in again. Blocking all browser storage may affect administrator sign-in. Public browsing and appointment requests do not require an administrator session.</p>
      </section>
      <section className="legal-section">
        <h2>Questions</h2>
        <p>For questions about cookies, browser storage, or personal information, email <a href="mailto:andayitimothy48@gmail.com">andayitimothy48@gmail.com</a>.</p>
      </section>
    </>
  )
}

function LegalPage({ type }) {
  const isPrivacy = type === 'privacy'
  return (
    <main className="legal-page">
      <article className="legal-document">
        {isPrivacy ? <PrivacyContent /> : <CookieContent />}
        <nav className="legal-related" aria-label="Related notices">
          <a href={isPrivacy ? '/cookies' : '/privacy'}>Read the {isPrivacy ? 'Cookie & Browser Storage' : 'Privacy'} Notice</a>
          <a href="/">Return to Celestique Beauty Spa</a>
        </nav>
      </article>
    </main>
  )
}

export function PrivacyPage() {
  return <LegalPage type="privacy" />
}

export function CookiePage() {
  return <LegalPage type="cookies" />
}
