'use client';

import { useState, useEffect } from 'react';
import { getTokenAccounts } from '@/utils/tokens';
import { useWallet } from '@/providers/WalletProvider';
import PhantomWalletButton from '@/components/phantom/PhantomWallet';
import FadeInContainer from '@/components/animation/containers/FadeInContainer';
import StaggerContainer from '@/components/animation/containers/StaggerContainer';
import SlideInContainer from '@/components/animation/containers/SlideInContainer';
import AnimatedButton from '@/components/animation/buttons/AnimatedButton';
import TokenCard from '@/components/tokens/TokenCard';

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

    return (
        <div className="min-h-screen bg-black text-white font-mono">
            <div className="container mx-auto px-4 py-8 relative z-0">
                <PhantomWalletButton />

                {isConnected ? (
                    <div className="mt-24 relative z-0">
                        <SlideInContainer className="bg-zinc-900/90 backdrop-blur-sm p-6 rounded-lg border border-zinc-800 mb-6">
                            <h2 className="text-xs text-purple-400 mb-2">TOTAL PORTFOLIO VALUE</h2>
                            <p className="text-3xl font-bold">
                                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </SlideInContainer>

                        <div className="bg-zinc-900/90 backdrop-blur-sm rounded-lg border border-zinc-800">
                            <div className="p-4 border-b border-zinc-800">
                                <h2 className="text-xl font-bold">Your Assets</h2>
                            </div>

                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-pulse text-purple-400">Loading assets...</div>
                                </div>
                            ) : (
                                <StaggerContainer className="divide-y divide-zinc-800">
                                    {tokens.map((token, index) => (
                                        <TokenCard key={index} token={token} />
                                    ))}
                                </StaggerContainer>
                            )}

                            {!isLoading && tokens.length === 0 && (
                                <div className="p-8 text-center text-gray-400">
                                    No tokens found in your wallet
                                </div>
                            )}
                        </div>

                        <FadeInContainer delay={0.5} className="mt-6 text-center">
                            <AnimatedButton
                                onClick={() => walletAddress && fetchTokens(walletAddress)}
                                disabled={isLoading}
                            >
                                Refresh Assets
                            </AnimatedButton>
                        </FadeInContainer>
                    </div>
                ) : (
                    <SlideInContainer className="mt-24 text-center">
                        <p className="text-gray-400">Connect your wallet to view your assets</p>
                    </SlideInContainer>
                )}
            </div>
        </div>
    );
}