"use client";

import { memo } from "react";
import { motion } from "framer-motion";

interface FooterProps {
  lang: "RU" | "EN";
}

const Footer = memo(function Footer({ lang }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full bg-[#0a0a0a] py-12 px-6 md:px-20 lg:px-32 flex justify-center items-center">
      
      <motion.footer
        whileHover="hover"
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25 
        }}
        variants={{
          hover: { scale: 1.005 }
        }}
        className="relative py-4 sm:py-5 px-6 sm:px-8 w-full h-14 sm:h-16 flex flex-row justify-between items-center rounded-[20px] bg-[#111113] border border-zinc-900 shadow-lg cursor-pointer select-none overflow-hidden"
      >
        
        {/* 1. ПОДЛОЖКА ДЛЯ ХОВЕРА */}
        <motion.div 
          initial={{ opacity: 0 }}
          variants={{
            hover: { opacity: 1 }
          }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-[#161619] z-0"
        />

        {/* 2. КОНТЕНТ ФУТЕРА */}
        
        {/* --- Левая часть: Копирайт --- */}
        <div className="relative z-10 h-4 flex items-center">
          <p className="text-[10px] sm:text-[11px] tracking-widest uppercase font-bold font-mono text-zinc-600 whitespace-nowrap">
            © {currentYear} D.BAUTIN
          </p>
          <motion.p 
            initial={{ opacity: 0 }}
            variants={{
              hover: { opacity: 1 }
            }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 text-[10px] sm:text-[11px] tracking-widest uppercase font-bold font-mono text-zinc-400 whitespace-nowrap"
          >
            © {currentYear} D.BAUTIN
          </motion.p>
        </div>

        {/* --- Правая часть: Статус --- */}
        <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          
          <div className="relative h-4 flex items-center">
            <span className="text-[9px] sm:text-[10px] tracking-wider uppercase font-bold font-mono text-zinc-600 whitespace-nowrap">
              {lang === "RU" ? "Доступен" : "Available"}
            </span>
            <motion.span 
              initial={{ opacity: 0 }}
              variants={{
                hover: { opacity: 1 }
              }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 text-[9px] sm:text-[10px] tracking-wider uppercase font-bold font-mono text-zinc-400 whitespace-nowrap"
            >
              {lang === "RU" ? "Доступен" : "Available"}
            </motion.span>
          </div>
        </div>

      </motion.footer>

    </div>
  );
});

export default Footer;