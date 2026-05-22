import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Toast({ message, type = 'success', show, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-medium shadow-xl ${
            type === 'success'
              ? 'bg-[#131d2e] border-[#00d4aa]/30 text-white'
              : 'bg-[#131d2e] border-red-500/30 text-white'
          }`}>
          <span>{type === 'success' ? '✅' : '❌'}</span>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
