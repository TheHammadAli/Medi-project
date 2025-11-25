import React from "react";

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "1. WHAT DO WE DO WITH YOUR INFORMATION?",
      content: `When you sign up on MediPredict or book a consultation, we collect personal details like your name, email, and medical information. This helps us provide personalized health predictions and facilitate doctor consultations.

We also collect your IP address to analyze usage patterns and ensure a secure experience across our platform.

With your consent, we may send health updates, newsletters, or service notifications via email.`,
    },
    {
      title: "2. CONSENT",
      content: `By submitting your data during sign-up, profile creation, or consultation, you give us permission to use it for those specific purposes.

For marketing communications, we request your explicit consent. You can withdraw consent anytime by contacting us at support@medipredict.ai or adjusting your preferences in your account settings.`,
    },
    {
      title: "3. DISCLOSURE",
      content: `We may disclose your information if required by law or to protect our rights, safety, or property.

We do not sell or rent your data. If you book a paid consultation, your payment details are securely processed via our third-party payment provider, and we never store card information ourselves.`,
    },
    {
      title: "4. THIRD-PARTY SERVICES",
      content: `MediPredict may integrate with third-party services such as payment gateways, chat APIs, or video consultation tools.

These partners will access only the minimum required information and are bound by strict privacy policies. We recommend reviewing their policies when redirected outside MediPredict.`,
    },
    {
      title: "5. DATA SECURITY",
      content: `We follow industry best practices to protect your medical and personal data. This includes encryption, secure storage, and access controls.

All sensitive data is transmitted via SSL, and medical records are stored using HIPAA-compliant practices where applicable.`,
    },
    {
      title: "6. USER RIGHTS & GDPR COMPLIANCE",
      content: `If you're a resident of the EU or another jurisdiction with data rights laws, you may access, correct, or request deletion of your personal data.

To make such a request, contact us at support@medipredict.ai. We respond to all inquiries in accordance with GDPR and similar frameworks.`,
    },
    {
      title: "7. AGE OF CONSENT",
      content: `By using MediPredict, you confirm that you are at least the age of majority in your location, or that you are using the platform under the guidance of a legal guardian.`,
    },
    {
      title: "8. CHANGES TO THIS PRIVACY POLICY",
      content: `We may update this privacy policy to reflect changes in our services or legal requirements. Updates will be posted here with a revised date.

Continued use of MediPredict after updates implies your acceptance of the revised policy.`,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto my-12 px-6 sm:px-10 md:px-14">
      {/* Header */}
      <section className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-blue-500">Privacy Policy</h2>
        <p className="text-gray-600 mt-4 text-sm sm:text-base max-w-2xl mx-auto">
          At MediPredict, we respect your privacy. This policy explains how we handle your data to ensure a secure and transparent experience.
        </p>
      </section>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.01] transition duration-300 ease-in-out"
          >
            <h3 className="text-xl font-semibold text-blue-500">{section.title}</h3>
            <p className="text-gray-600 mt-2 text-sm sm:text-base text-justify whitespace-pre-line">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-xs mt-12">
        Last Updated: May 14, 2025
      </p>
    </div>
  );
};

export default PrivacyPolicy;
