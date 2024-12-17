'use client';

import { useState, useEffect } from 'react';
import { getTokenAccounts } from '@/data/sol';
import { useWallet } from '@/providers/PhantomProvider';
import PhantomWalletButton from '@/components/phantom/PhantomWallet';
import SlideInContainer from '@/components/animation/containers/SlideInContainer';
import TokenTable from '@/components/tokens/TokenTable';

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
                    <TokenTable
                        tokens={tokens}
                        isLoading={isLoading}
                        totalValue={totalValue}
                        onRefresh={() => walletAddress && fetchTokens(walletAddress)}
                    />
                ) : (
                    <SlideInContainer className="mt-24 text-center">
                        <p className="text-gray-400">Connect your wallet to view your assets</p>
                    </SlideInContainer>
                )}
            </div>
        </div>
    );
}