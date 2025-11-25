import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faXTwitter,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";
import logoW from "../assets/Logo-White.svg";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 to-teal-900/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* Brand Section - Takes up more space */}
           <div className="col-span-1 md:col-span-2 lg:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl">
                <img src={logoW} alt="MediPredict" className="h-8 sm:h-10" />
              </div>
              <div>

              </div>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              AI-driven healthcare platform connecting patients with trusted medical professionals, providing instant access to consultations, accurate health insights, and personalized treatment recommendations.
            </p>

            {/* Social Media */}
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                 className="bg-white/10 hover:bg-blue-600 p-2 rounded-xl transition-all duration-300 hover:scale-110">
                <FontAwesomeIcon icon={faFacebook} className="text-xl" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                 className="bg-white/10 hover:bg-gray-600 p-2 rounded-xl transition-all duration-300 hover:scale-110">
                <FontAwesomeIcon icon={faXTwitter} className="text-xl" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                 className="bg-white/10 hover:bg-pink-600 p-2 rounded-xl transition-all duration-300 hover:scale-110">
                <FontAwesomeIcon icon={faInstagram} className="text-xl" />
              </a>
            </div>
          </div>

          {/* Services & Support - Better organized */}
           <div className="col-span-1 md:col-span-2 lg:col-span-4 hidden md:block">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {/* Our Services */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4 relative">
                  Our Services
                  <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 mt-2"></div>
                </h4>
                <ul className="space-y-2">
                  <li>
                    <span className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>
                      Online Consultation
                    </span>
                  </li>
                  <li>
                    <span className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>
                      Specialist Doctors
                    </span>
                  </li>
                  <li>
                    <span className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>
                      Health Education
                    </span>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4 relative">
                  Support
                  <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 mt-2"></div>
                </h4>
                <ul className="space-y-3">
                  <li>
                    <Link to="/contact" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy-policy" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms-of-service" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                      Terms & Conditions
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Company */}
           <div className="col-span-1 md:col-span-2 lg:col-span-3 hidden md:block">
            <h4 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4 relative">
              Company
              <div className="absolute bottom-0 left-0 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 mt-2"></div>
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  Our Doctors
                </Link>
              </li>
              <li>
                <Link to="/testimonial" className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-3 group-hover:bg-white transition-colors"></span>
                  Testimonials
                </Link>
              </li>
            </ul>
          </div>

          {/* Issue Connect Box - Positioned within main content area */}
          <div className="absolute bottom-1 right-4 sm:bottom-1 sm:right-6 lg:bottom-2 lg:right-8 z-10">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600 rounded-lg p-2 sm:p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 max-w-xs w-48 sm:w-64 lg:w-72">
             <div className="flex items-start space-x-2 sm:space-x-3">
               <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0 mt-0.5"></div>
               <div className="text-white text-xs font-medium">
                 <div className="text-slate-300 text-xs mb-1 hidden sm:block">Need Help? Support available anytime.</div>
                 <div className="text-slate-300 text-xs mb-1 sm:hidden">Need Help?</div>
                 <Link
                   to="/contact"
                   className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-xs underline"
                 >
                   Contact Support
                 </Link>
               </div>
             </div>
           </div>
         </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="text-center text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} MediPredict. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
