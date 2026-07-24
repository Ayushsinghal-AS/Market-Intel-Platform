import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../icons/Icon";

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card w-full max-w-md p-5 shadow-xl bg-white/95 dark:bg-slate-900/95"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold">{title}</h3>
              <button onClick={onClose} className="text-ink-muted hover:text-ink-primary-light dark:hover:text-ink-primary-dark">
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
