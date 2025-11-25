import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const SlideInOnScroll = ({ children, direction = "left", className = "" }) => {
  const [ref, inView] = useInView({
    triggerOnce: false,  // <--- Change this to false or remove this line entirely
    threshold: 0.2,
  });

  const variants = {
    hidden: {
      opacity: 0,
      x: direction === "left" ? -100 : 100,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default SlideInOnScroll;
