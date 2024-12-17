'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SlideInContainerProps {
    children: ReactNode;
    className?: string;
    direction?: 'up' | 'down' | 'left' | 'right';
    distance?: number;
}

export default function SlideInContainer({
    children,
    className = "",
    direction = 'up',
    distance = 20
}: SlideInContainerProps) {
    const getInitialY = () => {
        switch (direction) {
            case 'up': return distance;
            case 'down': return -distance;
            default: return 0;
        }
    };

    const getInitialX = () => {
        switch (direction) {
            case 'left': return distance;
            case 'right': return -distance;
            default: return 0;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: getInitialY(), x: getInitialX() }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            className={className}
        >
            {children}
        </motion.div>
    );
} 