import Link from "next/link"

export const metadata = {
  title: "Privacy Policy — Paytree",
  description: "How Paytree collects, uses, stores, and protects your personal data.",
}

// Legal doc dates are load-bearing (they set the "we changed this" clock for
// notification obligations). Bump these when you materially change the policy.
const EFFECTIVE_DATE = "July 4, 2026"
const LAST_UPDATED = "July 4, 2026"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="max-w-2xl mx-auto px-6 py-24">
        <Link href="/" className="text-[#00ff88] hover:underline text-sm font-mono">
          &larr; Back to Paytree
        </Link>

        <h1 className="text-3xl font-semibold text-[#f0f0f0] mb-2 mt-8">Privacy Policy</h1>
        <p className="text-[#b0b0b0] text-sm">
          Effective: {EFFECTIVE_DATE} · Last updated: {LAST_UPDATED}
        </p>

        <section className="mt-12">
          <p className="text-[#aaa] leading-relaxed text-sm">
            Paytree Inc. (&ldquo;Paytree&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;) operates paytree.to
            and the associated services (the &ldquo;Service&rdquo;). This Privacy Policy explains what
            personal data we collect, why we collect it, how we use it, and the rights you have over
            it. If any of this is unclear, email us at{" "}
            <a href="mailto:privacy@paytree.to" className="text-[#00ff88] hover:underline">privacy@paytree.to</a>{" "}
            — we&apos;ll answer in plain English.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">1. Information We Collect</h2>
          <p className="text-[#c9c9d1] leading-relaxed text-sm mb-3">
            We collect only what we need to run the Service and improve it.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#c9c9d1] text-sm leading-relaxed">
            <li><strong className="text-[#e0e0e0]">Account:</strong> name, email address, hashed password, and username.</li>
            <li><strong className="text-[#e0e0e0]">Profile content:</strong> bio, links, photos, products, vault items, and any other content you publish on your page.</li>
            <li><strong className="text-[#e0e0e0]">Payments:</strong> your Stripe Connect account ID and payout status. Card and bank details are held by Stripe — we never see or store them.</li>
            <li><strong className="text-[#e0e0e0]">Buyer email addresses:</strong> collected when a visitor unlocks a vault or completes a purchase, so we can deliver the item and let you contact them.</li>
            <li><strong className="text-[#e0e0e0]">Analytics:</strong> page views, link clicks, referrer, coarse geographic location (country / city), and device type. IP addresses are truncated within 30 days.</li>
            <li><strong className="text-[#e0e0e0]">Session data:</strong> a first-party authentication cookie so you stay signed in.</li>
            <li><strong className="text-[#e0e0e0]">Support communications:</strong> emails you send us and our replies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#c9c9d1] text-sm leading-relaxed">
            <li>Operate the Service — publishing your page, processing sales, delivering vault content.</li>
            <li>Send transactional emails — welcome, vault-unlock codes, purchase confirmations, receipts, security alerts.</li>
            <li>Show you analytics about your page.</li>
            <li>Detect and prevent fraud, abuse, and violations of our{" "}
              <Link href="/terms" className="text-[#00ff88] hover:underline">Terms</Link>.
            </li>
            <li>Improve and diagnose the platform (bug fixes, performance, usability testing).</li>
            <li>Comply with legal obligations (tax reporting, subpoenas, sanctions screening).</li>
          </ul>
          <p className="text-[#c9c9d1] leading-relaxed text-sm mt-3">
            We do <strong className="text-[#e0e0e0]">not</strong> sell your personal data, and we do
            not use it to train third-party AI models.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">3. Legal Bases (GDPR)</h2>
          <p className="text-[#c9c9d1] leading-relaxed text-sm mb-3">
            If you are in the EU, UK, or Switzerland, we process your data under one of these legal bases:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#c9c9d1] text-sm leading-relaxed">
            <li><strong className="text-[#e0e0e0]">Contract</strong> — to provide the Service you signed up for.</li>
            <li><strong className="text-[#e0e0e0]">Legitimate interests</strong> — to secure the Service, prevent fraud, and improve the product.</li>
            <li><strong className="text-[#e0e0e0]">Legal obligation</strong> — to comply with tax, financial, and law-enforcement requirements.</li>
            <li><strong className="text-[#e0e0e0]">Consent</strong> — for anything outside the above, and always for optional features like the AI sales agent.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">4. Service Providers</h2>
          <p className="text-[#c9c9d1] leading-relaxed text-sm mb-3">
            We share data only with the vendors necessary to operate the Service, each under a data-processing
            agreement that limits their use to the purposes below:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#c9c9d1] text-sm leading-relaxed">
            <li><strong className="text-[#e0e0e0]">Stripe</strong> — payment processing and payouts (Stripe Connect).</li>
            <li><strong className="text-[#e0e0e0]">Neon</strong> — Postgres database hosting (data stored in US or EU regions).</li>
            <li><strong className="text-[#e0e0e0]">Vercel</strong> — application hosting, file storage (Blob), and analytics.</li>
            <li><strong className="text-[#e0e0e0]">Resend</strong> — transactional email delivery.</li>
            <li><strong className="text-[#e0e0e0]">Anthropic</strong> — the AI sales agent (Ultra plan only). Only the AI-agent prompts and your page content are sent — no email addresses or PII.</li>
            <li><strong className="text-[#e0e0e0]">Google</strong> — optional &ldquo;Sign in with Google&rdquo;.</li>
            <li><strong className="text-[#e0e0e0]">Microsoft Clarity</strong> — session replay for UX debugging. Password and card inputs are automatically masked.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">5. International Data Transfers</h2>
          <p className="text-[#c9c9d1] leading-relaxed text-sm">
            Our primary infrastructure is hosted in the United States. If you access the Service from outside
            the US, your data will be transferred to and processed in the US. Where required, transfers rely on
            the European Commission&apos;s Standard Contractual Clauses or an equivalent lawful transfer mechanism.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">6. Cookies &amp; Similar Technologies</h2>
          <p className="text-[#c9c9d1] leading-relaxed text-sm mb-3">
            Paytree uses first-party cookies only. We do not run advertising or cross-site tracking cookies.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#c9c9d1] text-sm leading-relaxed">
            <li><strong className="text-[#e0e0e0]">Essential</strong> — authentication (session cookie), CSRF protection. You cannot disable these without losing the ability to sign in.</li>
            <li><strong className="text-[#e0e0e0]">Analytics</strong> — Vercel Analytics (aggregated, cookieless) and Microsoft Clarity for session replay. You can opt out by enabling &ldquo;Do Not Track&rdquo; in your browser.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">7. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#c9c9d1] text-sm leading-relaxed">
            <li>Account data — kept while your account is active.</li>
            <li>Analytics events — 24 months, then aggregated and anonymized.</li>
            <li>Transactional records — up to 7 years, as required by US and EU financial regulations.</li>
            <li>Backup snapshots — 35 days on a rolling window; deletions propagate within that window.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">8. Your Rights</h2>
          <p className="text-[#c9c9d1] leading-relaxed text-sm mb-3">
            Depending on where you live, you have some or all of these rights over your personal data:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#c9c9d1] text-sm leading-relaxed">
            <li><strong className="text-[#e0e0e0]">Access</strong> — a copy of the data we hold about you.</li>
            <li><strong className="text-[#e0e0e0]">Correction</strong> — fix inaccurate information.</li>
            <li><strong className="text-[#e0e0e0]">Deletion</strong> — remove your account and its data.</li>
            <li><strong className="text-[#e0e0e0]">Portability</strong> — export your data in a machine-readable format.</li>
            <li><strong className="text-[#e0e0e0]">Objection</strong> — object to certain processing.</li>
            <li><strong className="text-[#e0e0e0]">California residents (CCPA/CPRA)</strong> — the right to know, delete, correct, and opt-out of &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of personal information. We do not sell or share personal information as those terms are defined by the CCPA.</li>
          </ul>
          <p className="text-[#c9c9d1] leading-relaxed text-sm mt-3">
            You can exercise most of these rights directly from{" "}
            <Link href="/settings" className="text-[#00ff88] hover:underline">Settings</Link>, or by
            emailing{" "}
            <a href="mailto:privacy@paytree.to" className="text-[#00ff88] hover:underline">privacy@paytree.to</a>.
            We respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">9. Security</h2>
          <p className="text-[#c9c9d1] leading-relaxed text-sm">
            Passwords are hashed with argon2id. All data is encrypted in transit (TLS 1.3) and at rest
            (AES-256 at the storage layer). Access to production systems is limited to authorized staff,
            audited, and requires two-factor authentication. No system is perfectly secure, but we treat any
            unauthorized access as a top-priority incident and will notify affected users within 72 hours as
            required by GDPR Art. 34.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">10. Children</h2>
          <p className="text-[#c9c9d1] leading-relaxed text-sm">
            Paytree is not directed to children under 13 (or under 16 in the EU). We do not knowingly collect
            personal information from children. If you believe a child has provided us with personal
            information, email{" "}
            <a href="mailto:privacy@paytree.to" className="text-[#00ff88] hover:underline">privacy@paytree.to</a>{" "}
            and we will delete it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">11. Changes to This Policy</h2>
          <p className="text-[#c9c9d1] leading-relaxed text-sm">
            We may update this Privacy Policy from time to time. Material changes will be announced in-app or
            by email at least 14 days before they take effect. The &ldquo;Last updated&rdquo; date at the top
            always reflects the current version.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">12. Contact</h2>
          <p className="text-[#c9c9d1] leading-relaxed text-sm">
            Privacy questions, data requests, or complaints:{" "}
            <a href="mailto:privacy@paytree.to" className="text-[#00ff88] hover:underline">privacy@paytree.to</a>.
            If you are in the EU and are not satisfied with our response, you may complain to your local
            data protection authority.
          </p>
        </section>

        <div className="border-t border-white/[0.07] mt-16 pt-8">
          <p className="text-[#b0b0b0] text-sm">
            Also see our{" "}
            <Link href="/terms" className="text-[#00ff88] hover:underline">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
