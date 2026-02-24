export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Data Deletion Instructions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 24, 2025</p>

      <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold mb-2">How to Request Data Deletion</h2>
          <p>If you wish to have your data deleted from the VSA Vet Media Dashboard, you can do so using any of the following methods:</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Option 1: Disconnect via Facebook</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to your <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer" className="text-primary underline">Facebook Settings &gt; Business Integrations</a>.</li>
            <li>Find <strong>VSA Vet Media</strong> in the list of active integrations.</li>
            <li>Click <strong>Remove</strong> and check the box to delete all data the app has received about you.</li>
            <li>Confirm the removal.</li>
          </ol>
          <p className="mt-2">Once removed, we will delete all Meta-related data associated with your account within <strong>30 days</strong>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Option 2: Email Request</h2>
          <p>Send an email to <strong>privacy@vsavetmedia.com</strong> with the subject line <em>"Data Deletion Request"</em> and include:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Your full name</li>
            <li>The email address associated with your account</li>
            <li>Your clinic name (if applicable)</li>
          </ul>
          <p className="mt-2">We will process your request and delete all associated data within <strong>30 days</strong> of receiving your email.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">What Data Is Deleted</h2>
          <p>Upon a valid deletion request, we will permanently remove:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Your user profile and account information</li>
            <li>All stored Meta (Facebook/Instagram) page tokens and credentials</li>
            <li>Analytics data fetched from Meta APIs for your connected pages</li>
            <li>Any content drafts or scheduled posts associated with your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Confirmation</h2>
          <p>Once deletion is complete, you will receive a confirmation email at the address associated with your account. If you do not receive confirmation within 30 days, please contact us at <strong>privacy@vsavetmedia.com</strong>.</p>
        </section>

        <section>
          <p>For more information, see our <a href="/privacy-policy" className="text-primary underline">Privacy Policy</a>.</p>
        </section>
      </div>
    </div>
  );
}
