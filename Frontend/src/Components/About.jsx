import React from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineRobot, AiOutlineClockCircle, AiOutlineLock, AiOutlineTeam } from "react-icons/ai";
import { MdOutlineEventAvailable, MdInsights, MdVerified, MdHealthAndSafety } from "react-icons/md";
import { FaStethoscope, FaUserMd, FaArrowRight } from "react-icons/fa";

import SlideInOnScroll from "./SlideInOnScroll";

const features = [
  {
    icon: <AiOutlineRobot className="text-4xl text-blue-600 mb-4" />,
    title: "AI-Powered Diagnosis",
    description: "Our advanced AI models provide highly accurate disease predictions using cutting-edge machine learning algorithms.",
  },
  {
    icon: <AiOutlineClockCircle className="text-4xl text-green-600 mb-4" />,
    title: "Real-Time Consultations",
    description: "Connect instantly with expert doctors through secure chat and high-quality video calls, anytime, anywhere.",
  },
  {
    icon: <AiOutlineLock className="text-4xl text-purple-600 mb-4" />,
    title: "Enterprise-Grade Security",
    description: "HIPAA-compliant encryption and multi-layer security protocols ensure your health data remains completely private.",
  },
  {
    icon: <MdOutlineEventAvailable className="text-4xl text-indigo-600 mb-4" />,
    title: "Smart Appointment System",
    description: "AI-driven scheduling optimizes your time with intelligent slot recommendations and automated reminders.",
  },
  {
    icon: <MdInsights className="text-4xl text-teal-600 mb-4" />,
    title: "Personalized Health Insights",
    description: "Receive tailored health recommendations and preventive care suggestions based on your unique medical profile.",
  },
  {
    icon: <MdVerified className="text-4xl text-orange-600 mb-4" />,
    title: "Clinically Validated",
    description: "Our AI systems are trained on extensive medical datasets and continuously validated by leading healthcare professionals.",
  },
];

const stats = [
  { number: "99.5%", label: "Accuracy Rate" },
  { number: "50K+", label: "Patients Served" },
  { number: "500+", label: "Expert Doctors" },
  { number: "24/7", label: "Support Available" },
];

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <SlideInOnScroll direction="up">
              <h1 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
  Revolutionizing Healthcare
</h1>

              <p className="text-xl md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                MediPredict combines artificial intelligence with medical expertise to deliver unprecedented accuracy in disease prediction and personalized healthcare solutions.
              </p>
            </SlideInOnScroll>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Numbers that speak to our commitment to healthcare innovation
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <SlideInOnScroll key={index} direction={index % 2 === 0 ? "up" : "up"}>
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 text-center">
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              </SlideInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose MediPredict?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of healthcare with our comprehensive suite of AI-powered medical solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon, title, description }, index) => (
              <SlideInOnScroll
                key={index}
                direction={index % 2 === 0 ? "up" : "up"}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 text-center h-full">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    {React.cloneElement(icon, { className: "text-4xl text-blue-600" })}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
                  <p className="text-gray-600 leading-relaxed">{description}</p>
                </div>
              </SlideInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SlideInOnScroll direction="up">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl">
              <div className="max-w-4xl mx-auto">
                <FaStethoscope className="text-6xl mx-auto mb-8 text-blue-200" />
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Join Our Mission to Transform Healthcare
                </h2>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  We're building a future where AI and human expertise work together to provide accessible, accurate, and compassionate healthcare for everyone. Join our community of healthcare professionals and help shape the future of medicine.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate("/doctor-signup")}
                    className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                  >
                    <FaUserMd />
                    Join as Doctor
                  </button>
                  <button
                    onClick={() => navigate("/patient-signup")}
                    className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-105"
                  >
                    Get Started as Patient
                  </button>
                </div>
              </div>
            </div>
          </SlideInOnScroll>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: MdHealthAndSafety,
                title: "Patient-Centric",
                desc: "Every decision we make prioritizes patient safety, privacy, and positive health outcomes above all else.",
                color: "from-green-500 to-emerald-600"
              },
              {
                icon: AiOutlineTeam,
                title: "Collaboration",
                desc: "We work closely with healthcare professionals, researchers, and patients to continuously improve our solutions.",
                color: "from-blue-500 to-cyan-600"
              },
              {
                icon: MdVerified,
                title: "Innovation",
                desc: "We embrace cutting-edge technology while maintaining the highest standards of medical ethics and accuracy.",
                color: "from-purple-500 to-pink-600"
              },
            ].map((value, i) => (
              <SlideInOnScroll
                key={i}
                direction={i % 2 === 0 ? "up" : "up"}
                className="group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 text-center h-full">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <value.icon className="text-4xl text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.desc}</p>
                </div>
              </SlideInOnScroll>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
