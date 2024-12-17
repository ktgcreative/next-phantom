'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerItemProps {
    children: ReactNode;
    className?: string;
}

export default function StaggerItem({ children, className = "" }: StaggerItemProps) {
    const item = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <motion.div
            variants={item}
            className={className}
        >
            {children}
        </motion.div>
    );
} 