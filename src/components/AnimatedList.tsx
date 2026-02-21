import { motion } from "framer-motion";

interface AnimatedListItemProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

export function AnimatedListItem({ children, index = 0, className }: AnimatedListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
