'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedButtonProps {
    onClick?: () => void;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
}

export default function AnimatedButton({
    onClick,
    children,
    className = "",
    disabled = false,
    variant = 'primary'
}: AnimatedButtonProps) {
    const baseStyles = "px-6 py-2 rounded-md transition-colors";
    const variantStyles = {
        primary: "bg-purple-900 text-white hover:bg-purple-800",
        secondary: "bg-zinc-800 text-white hover:bg-zinc-700",
        danger: "bg-red-900/50 text-red-200 hover:bg-red-800"
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {children}
        </motion.button>
    );
} 