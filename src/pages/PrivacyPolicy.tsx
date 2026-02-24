export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 24, 2025</p>

      <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold mb-2">1. Introduction</h2>
          <p>VSA Vet Media ("we", "our", "us") operates the VSA Vet Media Dashboard application. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application, including data obtained through Meta (Facebook and Instagram) APIs.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Account Information:</strong> Name, email address, and profile information provided during registration.</li>
            <li><strong>Meta Platform Data:</strong> When you connect your Facebook Page or Instagram account, we access page insights, engagement metrics, follower counts, post performance data, and page metadata via the Meta Graph API.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our application, including pages visited and features used.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Display social media analytics and performance metrics in your dashboard.</li>
            <li>Generate content recommendations and marketing insights for your veterinary clinic.</li>
            <li>Manage and schedule social media content on your behalf.</li>
            <li>Improve and optimize our services.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Data Sharing and Disclosure</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share data only:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>With your explicit consent.</li>
            <li>To comply with legal obligations or enforce our policies.</li>
            <li>With service providers who assist in operating our application (e.g., hosting providers), bound by confidentiality agreements.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Data Retention</h2>
          <p>We retain your data for as long as your account is active or as needed to provide services. Meta platform data is refreshed periodically and older data may be overwritten. You may request deletion of your data at any time (see our <a href="/data-deletion" className="text-primary underline">Data Deletion Instructions</a>).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Your Rights</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
            <li><strong>Deletion:</strong> Request deletion of your data and disconnection of Meta accounts.</li>
            <li><strong>Revoke Access:</strong> You may revoke our access to your Meta data at any time through your Facebook Settings &gt; Business Integrations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">7. Data Security</h2>
          <p>We implement industry-standard security measures including encryption in transit (TLS), secure token storage, and access controls. However, no method of electronic storage is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8. Meta Platform Terms</h2>
          <p>Our use of information received from Meta APIs adheres to the <a href="https://developers.facebook.com/terms/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta Platform Terms</a> and <a href="https://developers.facebook.com/devpolicy/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Developer Policies</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">9. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at: <strong>privacy@vsavetmedia.com</strong></p>
        </section>
      </div>
    </div>
  );
}
