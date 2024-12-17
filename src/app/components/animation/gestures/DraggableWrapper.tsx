'use client';

import { motion, useMotionValue } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

interface DraggableWrapperProps {
    children: ReactNode;
    className?: string;
}

export default function DraggableWrapper({ children, className = "" }: DraggableWrapperProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const [constraints, setConstraints] = useState({
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    });

    useEffect(() => {
        setConstraints({
            top: -window.innerHeight + 100,
            left: -window.innerWidth + 100,
            right: 0,
            bottom: window.innerHeight - 200
        });

        const handleResize = () => {
            setConstraints({
                top: -window.innerHeight + 100,
                left: -window.innerWidth + 100,
                right: 0,
                bottom: window.innerHeight - 200
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <motion.div
            className={className}
            style={{ x, y }}
            drag
            dragMomentum={false}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: 0, y: 0 }}
            dragConstraints={constraints}
            dragElastic={0.1}
        >
            {children}
        </motion.div>
    );
} 