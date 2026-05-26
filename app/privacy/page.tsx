import Link from "next/link"

export const metadata = {
  title: "Privacy Policy - Paytree",
  description: "Learn how Paytree protects your privacy and handles your data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="max-w-2xl mx-auto px-6 py-24">
        <Link href="/" className="text-[#00ff88] hover:underline text-sm font-mono">
          &larr; Back to Paytree
        </Link>

        <h1 className="text-3xl font-semibold text-[#f0f0f0] mb-8 mt-8">
          Privacy Policy
        </h1>

        <p className="text-[#666] text-sm mb-12">Last updated: May 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">1. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#666] text-sm leading-relaxed">
            <li><strong className="text-[#e0e0e0]">Account information:</strong> Name, email address, and username when you create an account.</li>
            <li><strong className="text-[#e0e0e0]">Profile content:</strong> Links, images, products, vault items, and other content you create on your page.</li>
            <li><strong className="text-[#e0e0e0]">Analytics data:</strong> Page views, link clicks, and approximate visitor locations to power your analytics dashboard.</li>
            <li><strong className="text-[#e0e0e0]">Payment information:</strong> Processed securely by Stripe. We do not store your credit card details.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#666] text-sm leading-relaxed">
            <li>To provide and operate the Paytree service.</li>
            <li>To send transactional emails — vault unlock codes, purchase confirmations, and welcome messages.</li>
            <li>To show you analytics about your page performance (views, clicks, audience growth).</li>
            <li>To improve and optimize the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">3. Information Sharing</h2>
          <p className="text-[#666] leading-relaxed text-sm mb-4">
            We do not sell your personal data. We share information only with the service providers necessary to operate Paytree:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#666] text-sm leading-relaxed">
            <li><strong className="text-[#e0e0e0]">Stripe</strong> — payment processing</li>
            <li><strong className="text-[#e0e0e0]">Clerk</strong> — authentication</li>
            <li><strong className="text-[#e0e0e0]">Resend</strong> — transactional email delivery</li>
            <li><strong className="text-[#e0e0e0]">Vercel</strong> — hosting and file storage</li>
            <li><strong className="text-[#e0e0e0]">Supabase</strong> — database</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">4. Cookies</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#666] text-sm leading-relaxed">
            <li>We use essential cookies only — for authentication and session management.</li>
            <li>We do not use advertising or third-party tracking cookies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">5. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#666] text-sm leading-relaxed">
            <li>We keep your data for as long as your account is active.</li>
            <li>You can delete your account and all associated data at any time from your Settings page.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">6. Your Rights</h2>
          <p className="text-[#666] leading-relaxed text-sm mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#666] text-sm leading-relaxed">
            <li>Access the personal information we hold about you.</li>
            <li>Correct inaccurate data.</li>
            <li>Delete your account and data.</li>
          </ul>
          <p className="text-[#666] leading-relaxed text-sm mt-4">
            To exercise any of these rights, email us at{" "}
            <a href="mailto:privacy@paytree.to" className="text-[#00ff88] hover:underline">privacy@paytree.to</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#e0e0e0] mt-10 mb-4">7. Contact</h2>
          <p className="text-[#666] leading-relaxed text-sm">
            For questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:privacy@paytree.to" className="text-[#00ff88] hover:underline">privacy@paytree.to</a>.
          </p>
        </section>

        <div className="border-t border-white/[0.07] mt-16 pt-8">
          <p className="text-[#666] text-sm">
            Also see our{" "}
            <Link href="/terms" className="text-[#00ff88] hover:underline">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
