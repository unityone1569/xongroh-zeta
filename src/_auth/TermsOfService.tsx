const TermsOfService = () => {
  return (
    <div className="common-container">
      <div className="max-w-3xl flex flex-col w-full gap-8">
        <h2 className="h3-bold md:h2-bold w-full">Terms of Service</h2>
        <p
          className="base-regular 
        
        text-light-4"
        >
          Last Updated: 31st Decemeber 2024
        </p>

        <div className="flex flex-col gap-8">
          <section>
            <h3 className="h4-bold mb-4">1. Introduction</h3>
            <p className="base-regular">
              Welcome to Xongroh ("we," "our," or "us"). By accessing or using
              our platform, you agree to these Terms of Service ("Terms").
              Please read them carefully.
            </p>
          </section>

          <section>
            <h3 className="h4-bold mb-4">2. Services</h3>
            <p className="base-regular mb-3">
              Xongroh is a social marketplace platform designed for creators to:
            </p>
            <ul className="list-disc pl-6 base-regular">
              <li>• Share creative projects and works</li>
              <li>• Build portfolios</li>
              <li>• Interact and collaborate with other creators</li>
              <li>• Exchange messages and communicate</li>
              <li>• Participate in a vibrant community</li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">3. Account Registration</h3>
            <p className="base-regular mb-3">To use Xongroh, you must:</p>
            <ul className="list-disc pl-6 base-regular">
              <li>• Register an account with accurate and valid information</li>
              <li>• Verify your email address</li>
              <li>• Be at least 13 years of age</li>
              <li>• Ensure the security of your account credentials</li>
              <li>• Not share your account with others</li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">4. User Content</h3>
            <p className="base-regular mb-3">
              When you post content on Xongroh, you:
            </p>
            <ul className="list-disc pl-6 base-regular">
              <li>• Retain ownership of your intellectual property rights</li>
              <li>
                • Grant us a non-exclusive license to display your content on
                the platform
              </li>
              <li>
                • Warrant that your content does not infringe upon the rights of
                others
              </li>
              <li>
                • Agree not to post content that is illegal, harmful, or
                prohibited by these Terms
              </li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">5. Prohibited Activities</h3>
            <p className="base-regular mb-3">
              As a user of Xongroh, you agree not to:
            </p>
            <ul className="list-disc pl-6 base-regular">
              <li>• Post content that is illegal, harmful, or offensive</li>
              <li>• Impersonate others or misrepresent your identity</li>
              <li>• Engage in spamming, harassment, or abuse</li>
              <li>• Attempt to reverse-engineer or tamper with the platform</li>
              <li>• Circumvent security features or access controls</li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">6. Termination</h3>
            <p className="base-regular mb-3">
              We reserve the right to suspend or terminate your account if you:
            </p>
            <ul className="list-disc pl-6 base-regular">
              <li>• Violate these Terms</li>
              <li>• Engage in abusive, fraudulent, or illegal activities</li>
              <li>• Pose a security threat to our platform</li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">7. Disclaimers</h3>
            <ul className="list-disc pl-6 base-regular">
              <li>
                • Our services are provided on an "as is" and "as available"
                basis
              </li>
              <li>
                • We do not guarantee uninterrupted availability of the platform
              </li>
              <li>• We are not responsible for user-generated content</li>
            </ul>
          </section>

          <section>
            <h3 className="h4-bold mb-4">8. Contact</h3>
            <p className="base-regular">
              If you have any questions or concerns regarding these Terms,
              please contact us at{' '}
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

export default TermsOfService;
