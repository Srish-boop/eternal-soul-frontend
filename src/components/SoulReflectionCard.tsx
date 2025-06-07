import React from 'react';
import { motion } from 'framer-motion';

type SoulReflectionProps = {
  lifeArea: string;
  status: 'Gift' | 'Shadow' | 'Neutral';
  insight: string;
};

const getStatusStyles = (status: SoulReflectionProps['status']) => {
  switch (status) {
    case 'Gift':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Shadow':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Neutral':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    default:
      return '';
  }
};

export default function SoulReflectionCard({ lifeArea, status, insight }: SoulReflectionProps) {
  const styles = getStatusStyles(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl p-4 border shadow-sm ${styles} mb-4`}
    >
      <div className="text-xs uppercase tracking-wide font-semibold mb-1">{lifeArea}</div>
      <div className="text-sm font-medium italic mb-2">{status}</div>
      <p className="text-base">{insight}</p>
    </motion.div>
  );
}
