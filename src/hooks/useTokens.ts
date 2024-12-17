'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTokenAccounts } from '@/data/sol';
import { useWallet } from '@/providers/PhantomProvider';

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

export default function useTokens() {
    const { walletAddress, isConnected } = useWallet();
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalValue, setTotalValue] = useState(0);

    const fetchTokens = useCallback(async (address: string) => {
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
    }, []);

    useEffect(() => {
        if (isConnected && walletAddress) {
            fetchTokens(walletAddress);
        }
    }, [isConnected, walletAddress, fetchTokens]);

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

    return { tokens, isLoading, totalValue, fetchTokens };
} 