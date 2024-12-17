'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInContainerProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export default function FadeInContainer({ children, className = "", delay = 0 }: FadeInContainerProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
} 