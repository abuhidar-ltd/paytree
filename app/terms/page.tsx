import Link from "next/link"

export const metadata = {
  title: "Terms of Service — Paytree",
  description: "The rules for using Paytree — plainly stated.",
}

// Legal doc dates set the notification clock for material changes; bump both
// when the terms change materially.
const EFFECTIVE_DATE = "July 4, 2026"
const LAST_UPDATED = "July 4, 2026"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="max-w-2xl mx-auto px-6 py-24">
        <Link href="/" className="text-[#00ff88] hover:underline text-sm font-mono">
          &larr; Back to Paytree
        </Link>

        <h1 className="text-3xl font-semibold text-[#f0f0f0] mb-2 mt-8">Terms of Service</h1>
        <p className="text-[#666] text-sm">
          Effective: {EFFECTIVE_DATE} · Last updated: {LAST_UPDATED}
        </p>

        <section className="mt-12">
          <p className="text-[#aaa] leading-relaxed text-sm">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of paytree.to and the associated
            services (the &ldquo;Service&rdquo;) operated by Paytree Inc. (&ldquo;Paytree&rdquo;,
            &ldquo;we&rdquo;, &ldquo;our&rdquo;). By creating an account or using the Service, you agree
            to these Terms and to our{" "}
            <Link href="/privacy" className="text-[#00ff88] hover:underline">Privacy Policy</Link>.
            If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">1. Who Can Use Paytree</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#888] text-sm leading-relaxed">
            <li>You must be at least 13 years old (16 in the EU) to create an account.</li>
            <li>You must be at least 18 to receive payouts through Stripe Connect.</li>
            <li>You must provide accurate information and keep it up to date.</li>
            <li>You are responsible for all activity under your account and for keeping your password confidential.</li>
            <li>One person, one account. Multiple accounts to evade limits or bans are not permitted.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">2. The Service</h2>
          <p className="text-[#888] leading-relaxed text-sm">
            Paytree is a bio-link platform for creators who monetize. You can publish a page containing
            links, digital products, drops, vault-gated content, and payment integrations. We may add,
            change, or remove features at any time, and we will give reasonable notice of material changes
            that affect features you actively use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">3. Plans, Billing, and Refunds</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#888] text-sm leading-relaxed">
            <li><strong className="text-[#e0e0e0]">Free</strong> — no card required. Full core features.</li>
            <li><strong className="text-[#e0e0e0]">Pro</strong> — $4.99/month or $29.99/year. Includes drops, vaults, globe analytics, and cinematic themes. 7-day free trial.</li>
            <li><strong className="text-[#e0e0e0]">Ultra</strong> — $14.99/month or $99.99/year. Everything in Pro plus the AI sales agent. 7-day free trial.</li>
            <li>Subscriptions renew automatically until cancelled. You can cancel any time from{" "}
              <Link href="/settings" className="text-[#00ff88] hover:underline">Settings</Link>{" "}
              — access continues until the end of the paid period.
            </li>
            <li><strong className="text-[#e0e0e0]">Refunds:</strong> we offer a 7-day money-back guarantee on the first month or year you pay for. After that, subscription fees are non-refundable except where required by law (EU consumers retain their statutory 14-day withdrawal right).</li>
            <li>Price changes take effect at the start of your next billing cycle; we&apos;ll notify you at least 14 days in advance.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">4. Creator Payments and Fees</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#888] text-sm leading-relaxed">
            <li><strong className="text-[#e0e0e0]">0% platform fees on all plans</strong> — Paytree does not take a cut of your sales on Free, Pro, or Ultra.</li>
            <li>Stripe&apos;s standard payment-processing fees apply on every transaction (typically 2.9% + $0.30 in the US; see Stripe&apos;s pricing page for your region).</li>
            <li>Payouts, tax reporting (1099-K, EU equivalents), and KYC checks are handled by Stripe under Stripe Connect&apos;s own terms.</li>
            <li>You are the merchant of record for everything you sell on your page. You are responsible for describing your product accurately, delivering it, honoring any refund promises you make to your buyers, and complying with all applicable consumer-protection and tax laws.</li>
            <li>Chargebacks and reversals are debited from your Stripe balance in accordance with Stripe&apos;s terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">5. Your Content</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#888] text-sm leading-relaxed">
            <li>You retain full ownership of everything you publish on Paytree.</li>
            <li>You grant Paytree a worldwide, non-exclusive, royalty-free license to host, cache, format, and display your content solely as necessary to operate and improve the Service.</li>
            <li>You represent that you have the rights to everything you upload and that it does not infringe on anyone else&apos;s rights.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">6. Acceptable Use</h2>
          <p className="text-[#888] leading-relaxed text-sm mb-3">
            You may not use Paytree to publish, sell, promote, or facilitate any of the following:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#888] text-sm leading-relaxed">
            <li>Illegal goods or services (including any items restricted by Stripe&apos;s prohibited-business list).</li>
            <li>Adult or sexually explicit content without effective age gating and full compliance with local law.</li>
            <li>Fraud, phishing, deceptive links, misleading pricing, or fake products.</li>
            <li>Harassment, hate speech, incitement to violence, or targeted abuse.</li>
            <li>Malware, spyware, or content that damages other users&apos; devices or the Service.</li>
            <li>Content that infringes copyright, trademark, or other intellectual-property rights.</li>
            <li>Spamming your page&apos;s email list, or importing lists you did not collect yourself with consent.</li>
            <li>Abusing our infrastructure — scraping, load-testing, or circumventing rate limits.</li>
          </ul>
          <p className="text-[#888] leading-relaxed text-sm mt-3">
            We may remove content, restrict access, or terminate accounts that violate these rules, with or
            without notice depending on severity. Where we can, we&apos;ll try to give you a chance to fix it first.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">7. Intellectual Property</h2>
          <p className="text-[#888] leading-relaxed text-sm">
            Paytree, the Paytree logo, the design system, the software, and the underlying technology are
            owned by us and protected by intellectual-property law. Nothing in these Terms grants you any
            right to use those assets outside the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">8. Copyright &amp; DMCA</h2>
          <p className="text-[#888] leading-relaxed text-sm">
            If you believe content on Paytree infringes your copyright, send a DMCA-compliant notice to{" "}
            <a href="mailto:copyright@paytree.to" className="text-[#00ff88] hover:underline">copyright@paytree.to</a>.
            Include your contact info, identification of the copyrighted work, identification of the
            allegedly infringing material with a URL, a good-faith statement, an accuracy statement, and
            your electronic signature. Repeat infringers will have their accounts terminated.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">9. Termination</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#888] text-sm leading-relaxed">
            <li>You can delete your account at any time from{" "}
              <Link href="/settings" className="text-[#00ff88] hover:underline">Settings</Link>. Your page becomes unpublished immediately and your data is deleted according to our{" "}
              <Link href="/privacy" className="text-[#00ff88] hover:underline">Privacy Policy</Link>.
            </li>
            <li>We may suspend or terminate your account for material or repeated violations of these Terms, for legal reasons, or in response to a genuine risk of harm to us or other users.</li>
            <li>Sections that by their nature should survive termination (fees owed, IP, disclaimers, limitation of liability, dispute resolution) survive.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">10. Disclaimers</h2>
          <p className="text-[#888] leading-relaxed text-sm">
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the maximum
            extent permitted by law, Paytree disclaims all warranties, express or implied, including
            merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee
            uninterrupted or error-free service, or any particular sales results from your page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">11. Limitation of Liability</h2>
          <p className="text-[#888] leading-relaxed text-sm">
            To the maximum extent permitted by law, Paytree, its officers, employees, and vendors are not
            liable for any indirect, incidental, special, consequential, or punitive damages, or for any
            loss of profits, revenue, data, or goodwill, arising from your use of the Service. Our total
            aggregate liability for any claim will not exceed the greater of (a) the amount you paid us in
            the 12 months before the event giving rise to the claim, or (b) US $100.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">12. Indemnification</h2>
          <p className="text-[#888] leading-relaxed text-sm">
            You agree to indemnify Paytree against any third-party claim arising from (a) content you
            publish, (b) products or services you sell to buyers through the Service, or (c) your violation
            of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">13. Governing Law &amp; Disputes</h2>
          <p className="text-[#888] leading-relaxed text-sm">
            These Terms are governed by the laws of the State of Delaware, USA, without regard to
            conflict-of-laws principles. Any dispute will be resolved exclusively in the state or federal
            courts located in Delaware, unless applicable consumer-protection law grants you the right to
            sue in your own jurisdiction. You and Paytree waive any right to a jury trial and any right to
            participate in a class action against the other.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">14. Changes to These Terms</h2>
          <p className="text-[#888] leading-relaxed text-sm">
            We may update these Terms from time to time. Material changes will be announced in-app or by
            email at least 14 days before they take effect. Continuing to use the Service after the change
            takes effect means you accept the updated Terms. If you do not, you may stop using the Service
            and delete your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">15. Contact</h2>
          <p className="text-[#888] leading-relaxed text-sm">
            General support:{" "}
            <a href="mailto:support@paytree.to" className="text-[#00ff88] hover:underline">support@paytree.to</a>.
            Legal notices:{" "}
            <a href="mailto:legal@paytree.to" className="text-[#00ff88] hover:underline">legal@paytree.to</a>.
          </p>
        </section>

        <div className="border-t border-white/[0.07] mt-16 pt-8">
          <p className="text-[#666] text-sm">
            By using Paytree you acknowledge that you have read and agreed to these Terms of Service and
            our{" "}
            <Link href="/privacy" className="text-[#00ff88] hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
