import Link from "next/link";
import { PremiumBackground } from "@/components/backgrounds/premium-background";

export const metadata = {
  title: "Privacy Policy - Paytree",
  description: "Learn how Paytree protects your privacy and handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen text-white relative">
      <PremiumBackground />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-[#00ff88]">
            Paytree
          </Link>
          <Link href="/" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors">
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="glass rounded-2xl p-6 sm:p-12 space-y-8">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-sm sm:text-base text-gray-400">Last updated: December 17, 2024</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">1. Information We Collect</h2>
            <div className="space-y-3 text-sm sm:text-base text-gray-300">
              <p><strong>Account Information:</strong> When you create an account, we collect your email address, username, and profile information.</p>
              <p><strong>Payment Information:</strong> Payment processing is handled securely by Stripe. We do not store your credit card information.</p>
              <p><strong>Usage Data:</strong> We collect analytics data about how you use Paytree, including page views and link clicks.</p>
              <p><strong>Profile Content:</strong> We store the content you create, including links, images, and customization settings.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">2. How We Use Your Information</h2>
            <div className="space-y-2 text-sm sm:text-base text-gray-300">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain the Paytree service</li>
                <li>Process your subscription payments</li>
                <li>Send you service-related notifications</li>
                <li>Improve and optimize our platform</li>
                <li>Provide customer support</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">3. Information Sharing</h2>
            <div className="space-y-3 text-sm sm:text-base text-gray-300">
              <p><strong>We do not sell your personal information.</strong></p>
              <p>We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Stripe (payments), Vercel (hosting), Clerk (authentication)</li>
                <li><strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In the event of a merger or acquisition</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">4. Data Security</h2>
            <div className="space-y-3 text-sm sm:text-base text-gray-300">
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encrypted data transmission (HTTPS)</li>
                <li>Secure authentication via Clerk</li>
                <li>Regular security audits</li>
                <li>Limited access to personal information</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">5. Your Rights</h2>
            <div className="space-y-3 text-sm sm:text-base text-gray-300">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
              <p className="mt-4">To exercise these rights, contact us through your account settings or email us.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">6. Cookies</h2>
            <div className="space-y-3 text-sm sm:text-base text-gray-300">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Keep you signed in</li>
                <li>Remember your preferences</li>
                <li>Analyze site usage</li>
                <li>Improve security</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">7. Third-Party Services</h2>
            <div className="space-y-3 text-sm sm:text-base text-gray-300">
              <p>Paytree integrates with third-party services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Stripe:</strong> Payment processing (see <a href="https://stripe.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener">Stripe Privacy Policy</a>)</li>
                <li><strong>Clerk:</strong> Authentication (see <a href="https://clerk.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener">Clerk Privacy Policy</a>)</li>
                <li><strong>Vercel:</strong> Hosting and storage</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">8. Children's Privacy</h2>
            <div className="text-sm sm:text-base text-gray-300">
              <p>Paytree is not intended for users under 18 years of age. We do not knowingly collect information from children.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">9. International Users</h2>
            <div className="text-sm sm:text-base text-gray-300">
              <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">10. Changes to This Policy</h2>
            <div className="text-sm sm:text-base text-gray-300">
              <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the service.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">11. Contact Us</h2>
            <div className="text-sm sm:text-base text-gray-300">
              <p>If you have questions about this Privacy Policy, please contact us:</p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>Email:</strong> privacy@paytree.com</li>
                <li><strong>Website:</strong> <Link href="/" className="text-blue-400 hover:underline">paytree.com</Link></li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
