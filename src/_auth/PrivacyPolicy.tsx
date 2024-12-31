const PrivacyPolicy = () => {
  return (
    <div className="common-container">
      <div className="max-w-3xl flex flex-col w-full gap-8">
        <h2 className="h3-bold md:h2-bold w-full">Privacy Policy</h2>
        <p className="base-regular text-light-4">
          Last Updated: 31st Decemeber 2024
        </p>

        <div className="flex flex-col gap-8">
          <section>
            <h3 className="h4-bold mb-4">1. Information We Collect</h3>
            <p className="base-regular mb-3">
              We collect the following categories of information:
            </p>

            <h4 className="base-semibold mb-2">Account Information</h4>
            <ul className="list-disc pl-6 base-regular mb-4">
              <li>• Name</li>
              <li>• Email address</li>
              <li>• Password (encrypted)</li>
              <li>• Profile picture</li>
              <li>• Cover picture</li>
              <li>• Hometown</li>
              <li>• Biography</li>
              <li>• Professional details</li>
            </ul>

            <h4 className="base-semibold mb-2">Content</h4>
            <ul className="list-disc pl-6 base-regular mb-4">
              <li>• Creations and projects</li>
              <li>• Comments, Feedbacks and messages</li>
              <li>• Media files (e.g., images, videos, audio)</li>
            </ul>

            <h4 className="base-semibold mb-2">Technical Data</h4>
            <ul className="list-disc pl-6 base-regular">
              <li>• IP address</li>
              <li>• Device details</li>
              <li>• Usage analytics</li>
              <li>• Cookies and tracking data</li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">2. How We Use Your Information</h3>
            <ul className="list-disc pl-6 base-regular">
              <li>• Provide and improve platform services</li>
              <li>• Process content uploads</li>
              <li>• Enable user messaging and interactions</li>
              <li>• Enhance features and user experience</li>
              <li>• Ensure security and compliance</li>
              <li>• Send important notifications</li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">3. Information Sharing</h3>
            <p className="base-regular mb-3">We may share your information:</p>
            <ul className="list-disc pl-6 base-regular">
              <li>• With other users, based on your privacy settings</li>
              <li>• When required by law or to protect our legal rights</li>
              <li>
                • With trusted service providers supporting our platform
                operations
              </li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">4. Data Security</h3>
            <ul className="list-disc pl-6 base-regular">
              <li>• Email verification</li>
              <li>• Strong password encryption</li>
              <li>• End-to-end message encryption</li>
              <li>• Secure file storage</li>
              <li>• Role-based access controls</li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">5. Your Rights</h3>
            <ul className="list-disc pl-6 base-regular">
              <li>• Access your personal data</li>
              <li>• Update or modify your profile</li>
              <li>• Delete your account and associated data</li>
              <li>• Control your privacy preferences</li>
              <li>• Export your data upon request</li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">6. Data Storage</h3>
            <ul className="list-disc pl-6 base-regular">
              <li>• Data is securely stored using Appwrite</li>
              <li>• Files are saved in secure storage buckets</li>
              <li>• Messages are encrypted for privacy</li>
              <li>• Backups are maintained for disaster recovery</li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">7. Third-Party Services</h3>
            <ul className="list-disc pl-6 base-regular">
              <li>• Appwrite for backend infrastructure</li>
              <li>• Google OAuth for authentication</li>
              <li>• Cloud services for secure storage</li>
              <li>• Analytics tools to improve our platform</li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">8. Children's Privacy</h3>
            <p className="base-regular">
              Xongroh is not intended for children under 13. We do not knowingly
              collect personal data from children. If we discover such data, it
              will be promptly deleted.
            </p>
          </section>

          <section>
            <h3 className="h4-bold mb-4">9. Updates to This Policy</h3>
            <p className="base-regular">
              We may update this Privacy Policy from time to time. Changes will
              be posted here, and we will notify you of significant updates.
            </p>
          </section>

          <section>
            <h3 className="h4-bold mb-4">10. Contact</h3>
            <p className="base-regular">
              If you have any questions about our Privacy Policy, contact us at{' '}
              <a
                href="mailto:support@xongroh.com"
                className="text-primary-500 hover:underline"
              >
                support@xongroh.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
