'use client';

import { motion, useMotionValue } from 'framer-motion';
import PhantomWalletButton from './PhantomWalletButton';

export default function WalletButton() {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    return (
        <motion.div
            className="fixed top-4 right-4 z-50"
            style={{ x, y }}
            drag
            dragMomentum={false}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            initial={{ x: 0, y: 0 }}
            dragConstraints={{
                top: -window.innerHeight + 100,
                left: -window.innerWidth + 100,
                right: 0,
                bottom: window.innerHeight - 200
            }}
            dragElastic={0.1}
        >
            <PhantomWalletButton />
        </motion.div>
    );
} 