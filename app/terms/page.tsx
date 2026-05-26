import Link from "next/link"

export const metadata = {
  title: "Terms of Service - Paytree",
  description: "Read the terms and conditions for using Paytree.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="max-w-2xl mx-auto px-6 py-24">
        <Link href="/" className="text-[#00ff88] hover:underline text-sm font-mono">
          &larr; Back to Paytree
        </Link>

        <h1 className="text-3xl font-semibold text-[#f0f0f0] mb-8 mt-8">
          Terms of Service
        </h1>

        <p className="text-[#666] text-sm mb-12">Last updated: May 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">1. Acceptance of Terms</h2>
          <p className="text-[#666] leading-relaxed text-sm">
            By accessing or using Paytree, you agree to be bound by these Terms of Service. If you do not agree to these Terms, you may not use the Service. We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">2. Description of Service</h2>
          <p className="text-[#666] leading-relaxed text-sm">
            Paytree is a bio link platform for creators who monetize. The Service allows users to create a personalized page containing links, digital products, gated content, payment integrations, and other content to convert profile visitors into paying customers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">3. User Accounts</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#666] text-sm leading-relaxed">
            <li>You must be at least 18 years old to use paid features.</li>
            <li>You are responsible for maintaining the security of your account and password.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>You must provide accurate and complete information when creating your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">4. Creator Payments &amp; Fees</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#666] text-sm leading-relaxed">
            <li><strong className="text-[#e0e0e0]">Free plan:</strong> Cannot publish a live page. No selling capabilities.</li>
            <li><strong className="text-[#e0e0e0]">Starter plan:</strong> 5% transaction fee on all sales made through your page.</li>
            <li><strong className="text-[#e0e0e0]">Ultra plan:</strong> 0% transaction fees from Paytree.</li>
            <li>All payments are processed securely by Stripe. Standard Stripe processing fees apply on all plans.</li>
            <li>Paytree is not responsible for disputes between creators and their buyers. Creators are responsible for fulfilling their products and services.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">5. Prohibited Content</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#666] text-sm leading-relaxed">
            <li>No illegal content or activities.</li>
            <li>No spam, misleading links, or deceptive practices.</li>
            <li>No adult content without proper age gating mechanisms.</li>
            <li>No harassment, hate speech, or discrimination.</li>
            <li>No malware, phishing, or harmful code.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">6. Intellectual Property</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#666] text-sm leading-relaxed">
            <li>You retain full ownership of the content you create and publish on Paytree.</li>
            <li>Paytree owns the platform, its design, features, and underlying technology.</li>
            <li>By using the Service, you grant Paytree a limited license to display your content as necessary to operate the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">7. Termination</h2>
          <p className="text-[#666] leading-relaxed text-sm">
            We reserve the right to suspend or terminate accounts that violate these Terms, engage in prohibited activities, or for any reason at our discretion. You may delete your account at any time from your Settings page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">8. Limitation of Liability</h2>
          <p className="text-[#666] leading-relaxed text-sm">
            Paytree is provided &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; without warranties of any kind. To the maximum extent permitted by law, Paytree shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the preceding 12 months.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">9. Changes to Terms</h2>
          <p className="text-[#666] leading-relaxed text-sm">
            We may update these Terms from time to time. We will notify you of significant changes via email or through the Service. Your continued use of Paytree after changes take effect constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">10. Contact</h2>
          <p className="text-[#666] leading-relaxed text-sm">
            For questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:support@paytree.to" className="text-[#00ff88] hover:underline">support@paytree.to</a>.
          </p>
        </section>

        <div className="border-t border-white/[0.07] mt-16 pt-8">
          <p className="text-[#666] text-sm">
            By using Paytree, you acknowledge that you have read and agree to these Terms of Service and our{" "}
            <Link href="/privacy" className="text-[#00ff88] hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
