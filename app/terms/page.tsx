import Link from "next/link";
import { PremiumBackground } from "@/components/backgrounds/premium-background";

export const metadata = {
  title: "Terms of Service - Paytree",
  description: "Read the terms and conditions for using Paytree.",
};

export default function TermsPage() {
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
            <h1 className="text-3xl sm:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-sm sm:text-base text-gray-400">Last updated: December 17, 2024</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">1. Acceptance of Terms</h2>
            <div className="text-sm sm:text-base text-gray-300 space-y-3">
              <p>By accessing or using Paytree ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.</p>
              <p>We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">2. Description of Service</h2>
            <div className="text-sm sm:text-base text-gray-300 space-y-3">
              <p>Paytree provides a platform for users to create and manage a personalized page containing links, payment information, and other content ("User Page").</p>
              <p>The Service includes both free and paid subscription plans with varying features and limitations.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">3. User Accounts</h2>
            <div className="text-sm sm:text-base text-gray-300 space-y-3">
              <p><strong>Account Creation:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You must be at least 18 years old to create an account</li>
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You are responsible for all activities under your account</li>
                <li>One person or business may not maintain more than one free account</li>
              </ul>
              <p className="mt-3"><strong>Account Termination:</strong> We reserve the right to suspend or terminate accounts that violate these Terms or for any other reason at our discretion.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">4. Subscriptions and Payments</h2>
            <div className="text-sm sm:text-base text-gray-300 space-y-3">
              <p><strong>Free Plan:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Limited features as specified on the pricing page</li>
                <li>Cannot publish live pages</li>
                <li>Preview functionality only</li>
              </ul>
              <p className="mt-3"><strong>Pro Plan ($4.99/month):</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>7-day free trial (no charge if cancelled before trial ends)</li>
                <li>Automatically renews monthly unless cancelled</li>
                <li>Full access to all features</li>
                <li>Ability to publish live pages</li>
              </ul>
              <p className="mt-3"><strong>Payment Processing:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Payments are processed securely by Stripe</li>
                <li>All fees are in USD unless otherwise stated</li>
                <li>You authorize us to charge your payment method</li>
                <li>Failed payments may result in service suspension</li>
              </ul>
              <p className="mt-3"><strong>Refunds:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You may cancel your subscription at any time</li>
                <li>Cancellation takes effect at the end of the current billing period</li>
                <li>No refunds for partial months</li>
                <li>Trial cancellations before the trial ends incur no charges</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">5. Content and Conduct</h2>
            <div className="text-sm sm:text-base text-gray-300 space-y-3">
              <p><strong>User Content:</strong> You retain ownership of content you post to Paytree. By posting content, you grant us a worldwide, non-exclusive license to use, display, and distribute your content as necessary to provide the Service.</p>
              <p className="mt-3"><strong>Prohibited Content and Activities:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Illegal activities or content</li>
                <li>Harassment, hate speech, or discrimination</li>
                <li>Spam or misleading information</li>
                <li>Infringement of intellectual property rights</li>
                <li>Malware, viruses, or harmful code</li>
                <li>Impersonation or fraudulent activity</li>
                <li>Adult content or services</li>
                <li>Pyramid schemes or multi-level marketing</li>
              </ul>
              <p className="mt-3">We reserve the right to remove any content that violates these Terms or is otherwise objectionable.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">6. Intellectual Property</h2>
            <div className="text-sm sm:text-base text-gray-300 space-y-3">
              <p>The Paytree Service, including its original content, features, and functionality, is owned by Paytree and is protected by international copyright, trademark, and other intellectual property laws.</p>
              <p>You may not copy, modify, distribute, sell, or lease any part of our Service without our express written permission.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">7. Service Availability</h2>
            <div className="text-sm sm:text-base text-gray-300 space-y-3">
              <p>We strive to provide reliable service, but we do not guarantee:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Uninterrupted or error-free operation</li>
                <li>That defects will be corrected</li>
                <li>That the Service is free of viruses or harmful components</li>
              </ul>
              <p className="mt-3">We reserve the right to modify, suspend, or discontinue the Service at any time without notice.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">8. Limitation of Liability</h2>
            <div className="text-sm sm:text-base text-gray-300 space-y-3">
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Paytree is provided "AS IS" and "AS AVAILABLE"</li>
                <li>We make no warranties, express or implied</li>
                <li>We are not liable for any indirect, incidental, special, or consequential damages</li>
                <li>Our total liability shall not exceed the amount you paid us in the past 12 months</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">9. Indemnification</h2>
            <div className="text-sm sm:text-base text-gray-300">
              <p>You agree to indemnify and hold harmless Paytree and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Content you post on the Service</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">10. Dispute Resolution</h2>
            <div className="text-sm sm:text-base text-gray-300 space-y-3">
              <p><strong>Informal Resolution:</strong> We encourage you to contact us first to resolve any disputes informally.</p>
              <p><strong>Arbitration:</strong> Any disputes that cannot be resolved informally shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</p>
              <p><strong>Class Action Waiver:</strong> You agree that disputes will be resolved on an individual basis and not as part of a class action.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">11. Governing Law</h2>
            <div className="text-sm sm:text-base text-gray-300">
              <p>These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">12. Severability</h2>
            <div className="text-sm sm:text-base text-gray-300">
              <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">13. Contact Information</h2>
            <div className="text-sm sm:text-base text-gray-300">
              <p>For questions about these Terms, please contact us:</p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>Email:</strong> legal@paytree.com</li>
                <li><strong>Website:</strong> <Link href="/" className="text-blue-400 hover:underline">paytree.com</Link></li>
              </ul>
            </div>
          </section>

          <section className="space-y-4 pt-8 border-t border-white/10">
            <p className="text-sm text-gray-400">
              By using Paytree, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
