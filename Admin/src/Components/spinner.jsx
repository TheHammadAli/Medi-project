import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStethoscope } from "@fortawesome/free-solid-svg-icons";

const Spinner = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 10000); // Show for 10 seconds
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes dotFade {
          0%, 80%, 100% { opacity: 0; transform: scale(0.6); }
          40% { opacity: 1; transform: scale(1); }
        }

        .dot {
          width: 10px;
          height: 10px;
          margin: 0 6px;
          border-radius: 9999px;
          background-color: #3B82F6;
          animation: dotFade 1.2s infinite ease-in-out;
        }

        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        .dot:nth-child(4) { animation-delay: 0.6s; }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="flex items-center space-x-4">
          <FontAwesomeIcon icon={faStethoscope} className="text-4xl text-blue-600" />
          <div className="flex">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Spinner;
