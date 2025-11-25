import React from "react";

const TermsAndServices = () => {
  const sections = [
    {
      title: "1. ACCEPTANCE OF TERMS",
      content: `By accessing or using MediPredict, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree with any part of these terms, you may not use our platform.`,
    },
    {
      title: "2. DESCRIPTION OF SERVICES",
      content: `MediPredict provides AI-powered healthcare tools including disease prediction, real-time doctor consultations, and appointment management.

We do not replace professional medical advice. All information provided should be reviewed by a licensed physician before taking action.`,
    },
    {
      title: "3. ACCOUNT REGISTRATION",
      content: `To use certain features, you must create an account and provide accurate personal and medical information.

You are responsible for maintaining confidentiality of your credentials and for all activity under your account.`,
    },
    {
      title: "4. USER CONDUCT",
      content: `You agree not to misuse the platform. This includes transmitting harmful content, attempting unauthorized access, or disrupting service for others.

Violations may result in suspension or termination of your account without notice.`,
    },
    {
      title: "5. PAYMENTS AND BILLING",
      content: `Some services on MediPredict may require payment (e.g., doctor consultations). All fees must be paid through approved gateways.

You agree to provide valid payment information and understand that prices are subject to change.`,
    },
    {
      title: "6. INTELLECTUAL PROPERTY",
      content: `All content on MediPredict, including the AI system, branding, and design elements, are protected by copyright and intellectual property laws.

You may not copy, reproduce, or use any materials without express permission.`,
    },
    {
      title: "7. TERMINATION",
      content: `We reserve the right to terminate your access if you violate these terms, misuse the platform, or engage in fraudulent behavior.

Upon termination, your access to services and stored data may be restricted or deleted.`,
    },
    {
      title: "8. LIMITATION OF LIABILITY",
      content: `MediPredict is not liable for any direct or indirect damages resulting from use of the platform, including but not limited to health outcomes or loss of data.

Always consult a qualified healthcare provider before acting on any information.`,
    },
    {
      title: "9. MODIFICATIONS TO TERMS",
      content: `We may update these Terms of Service from time to time. Changes will be posted on this page with an updated date.

Continued use of MediPredict after updates constitutes acceptance of the new terms.`,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto my-12 px-6 sm:px-10 md:px-14">
      {/* ✅ Page Header */}
      <section className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-blue-500">Terms & Services</h2>
        <p className="text-gray-600 mt-4 text-sm sm:text-base max-w-2xl mx-auto">
          These terms govern your use of MediPredict. By accessing our platform, you agree to follow these rules and responsibilities.
        </p>
      </section>

      {/* ✅ Terms Sections */}
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

      {/* ✅ Footer Note */}
      <p className="text-center text-gray-400 text-xs mt-12">
        Last Updated: May 14, 2025
      </p>
    </div>
  );
};

export default TermsAndServices;
