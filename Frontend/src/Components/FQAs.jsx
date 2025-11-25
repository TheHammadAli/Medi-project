import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faEnvelope, faUserPlus, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import SlideInOnScroll from "./SlideInOnScroll";
import { FaArrowRight } from "react-icons/fa";

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const navigate = useNavigate();

  // ✅ FAQ Data
  const faqs = [
    {
      question: "How does MediPredict AI work?",
      answer: "Users enter symptoms, AI predicts possible diseases, and they can consult doctors via chat, video calls, or book appointments.",
    },
    {
      question: "Which diseases can MediPredict AI predict?",
      answer: "The system predicts Diabetes, Heart Disease, and Parkinson’s Disease using AI models like Logistic Regression and SVM Classifier.",
    },
    {
      question: "How does the AI-based disease prediction work?",
      answer: "The AI analyzes user-entered symptoms and provides disease predictions based on trained medical datasets.",
    },
    {
      question: "Is my personal medical data secure?",
      answer: "Yes, MediPredict AI uses encryption, access controls, and secure authentication to protect user data.",
    },
    {
      question: "Can I consult a doctor in real-time?",
      answer: "Yes, the platform offers real-time chat and video consultations with doctors.",
    },
    {
      question: "How do I book an appointment?",
      answer: "Patients can book, reschedule, or cancel appointments through the platform’s scheduling system.",
    },
  ];

  // ✅ Handle Toggle for FAQ
  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <SlideInOnScroll direction="up">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h1>
              <p className="text-xl md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Find answers to common questions about MediPredict AI, our services, and how our platform works.
              </p>
            </SlideInOnScroll>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <SlideInOnScroll key={index} direction={index % 2 === 0 ? "left" : "right"}>
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex justify-between items-center px-6 py-4 text-left text-lg font-semibold text-gray-900 hover:bg-gray-50 transition-all rounded-2xl"
                  >
                    {faq.question}
                    <FontAwesomeIcon
                      icon={openIndex === index ? faChevronUp : faChevronDown}
                      className="text-blue-500 text-lg"
                    />
                  </button>
                  {openIndex === index && (
                    <div className="px-6 py-4 bg-gray-50 text-gray-700 border-t text-base leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              </SlideInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideInOnScroll direction="up">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                If you have any more questions or need further assistance, feel free to reach out to our support team.
              </p>
              <button
                onClick={() => navigate("/contact")}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <FontAwesomeIcon icon={faEnvelope} />
                Contact Us
                <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          </SlideInOnScroll>
        </div>
      </section>

      {/* Get Started Section */}
      <section className="py-24 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideInOnScroll direction="up">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Are You Ready To Get Started!</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Join MediPredict today and take control of your health with AI-powered disease prediction and expert medical advice.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/signup")}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  Sign Up
                  <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate("/about")}
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <FontAwesomeIcon icon={faInfoCircle} />
                  Learn More
                </button>
              </div>
            </div>
          </SlideInOnScroll>
        </div>
      </section>
    </div>
  );
};

export default FAQs;
