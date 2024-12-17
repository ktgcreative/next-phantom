'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTokenAccounts } from '@/app/utils/tokens';
import { useWallet } from '@/app/providers/WalletProvider';
import PhantomWalletButton from '@/app/components/phantom/PhantomWallet';

interface TokenInfo {
    mint: string;
    amount: number;
    decimals: number;
    symbol: string;
    name: string;
    logo?: string;
    price?: number;
    verified?: boolean;
}

export default function TokensPage() {
    const { walletAddress, isConnected } = useWallet();
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalValue, setTotalValue] = useState(0);

    const fetchTokens = async (address: string) => {
        try {
            setIsLoading(true);
            const tokenData = await getTokenAccounts(address);
            setTokens(tokenData);

            // Calculate total portfolio value
            const total = tokenData.reduce((acc, token) => {
                return acc + (token.price || 0) * (token.amount || 0);
            }, 0);
            setTotalValue(total);
        } catch (error) {
            console.error('Error fetching tokens:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isConnected && walletAddress) {
            fetchTokens(walletAddress);
        }
    }, [isConnected, walletAddress]);

    useEffect(() => {
        const handleWalletRefresh = () => {
            if (walletAddress) {
                fetchTokens(walletAddress);
            }
        };

        window.addEventListener('wallet-refreshed', handleWalletRefresh);

        return () => {
            window.removeEventListener('wallet-refreshed', handleWalletRefresh);
        };
    }, [walletAddress, fetchTokens]);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <div className="min-h-screen bg-black text-white font-mono">
            <div className="container mx-auto px-4 py-8 relative z-0">
                <PhantomWalletButton />

                {isConnected && (
                    <div className="mt-24 relative z-0">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900/90 backdrop-blur-sm p-6 rounded-lg border border-zinc-800 mb-6"
                        >
                            <h2 className="text-xs text-purple-400 mb-2">TOTAL PORTFOLIO VALUE</h2>
                            <p className="text-3xl font-bold">
                                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </motion.div>

                        <div className="bg-zinc-900/90 backdrop-blur-sm rounded-lg border border-zinc-800">
                            <div className="p-4 border-b border-zinc-800">
                                <h2 className="text-xl font-bold">Your Assets</h2>
                            </div>

                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-pulse text-purple-400">Loading assets...</div>
                                </div>
                            ) : (
                                <motion.div
                                    variants={container}
                                    initial="hidden"
                                    animate="show"
                                    className="divide-y divide-zinc-800"
                                >
                                    {tokens.map((token, index) => (
                                        <motion.div
                                            key={index}
                                            variants={item}
                                            className="p-4 hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    {/* Token Icon */}
                                                    {token.logo ? (
                                                        <img
                                                            src={token.logo}
                                                            alt={token.symbol}
                                                            className="w-10 h-10 rounded-full"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png'
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center">
                                                            <span className="text-sm text-purple-300">
                                                                {token.symbol.slice(0, 2)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Token Info */}
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-bold">{token.symbol}</span>
                                                            {token.verified && (
                                                                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-400">{token.name}</p>
                                                    </div>
                                                </div>

                                                {/* Token Value */}
                                                <div className="text-right">
                                                    <p className="font-bold">
                                                        {token.amount.toLocaleString()} {token.symbol}
                                                    </p>
                                                    {token.price ? (
                                                        <p className="text-sm text-gray-400">
                                                            ${(token.price * token.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">Price unavailable</p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {!isLoading && tokens.length === 0 && (
                                <div className="p-8 text-center text-gray-400">
                                    No tokens found in your wallet
                                </div>
                            )}
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-6 text-center"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => walletAddress && fetchTokens(walletAddress)}
                                className="bg-purple-900 text-white px-6 py-2 rounded-md hover:bg-purple-800 transition-colors"
                            >
                                Refresh Assets
                            </motion.button>
                        </motion.div>
                    </div>
                )}

                {!isConnected && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-24 text-center"
                    >
                        <p className="text-gray-400">Connect your wallet to view your assets</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}