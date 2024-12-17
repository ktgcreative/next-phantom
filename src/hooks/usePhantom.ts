'use client';

import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@/providers/PhantomProvider';
import { TokenInfo } from '@/data/sol';

interface UsePhantomReturn {
    // Wallet State
    walletAddress: string;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;

    // Balance & Tokens
    balance: {
        balance: number;
        uiBalance: number;
        price: number;
        value: number;
    };
    tokens: TokenInfo[];
    totalValue: number;

    // Actions
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    refresh: () => Promise<void>;

    // UI State
    isRefreshing: boolean;
    setError: (error: string | null) => void;
}

export default function usePhantom(): UsePhantomReturn {
    // Local UI State
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Global Wallet State
    const {
        walletAddress,
        isConnected,
        balance,
        tokens,
        isLoading,
        lastUpdated,
        connectWallet,
        disconnectWallet,
        fetchWalletData,
        fetchTokens
    } = useWallet();

    // Handle auto-refresh on wallet events
    useEffect(() => {
        const handleAccountChange = () => {
            if (walletAddress) {
                handleRefresh();
            }
        };

        window.addEventListener('accountsChanged', handleAccountChange);
        return () => {
            window.removeEventListener('accountsChanged', handleAccountChange);
        };
    }, [walletAddress]);

    const handleRefresh = useCallback(async () => {
        if (isRefreshing || !walletAddress) return;

        setIsRefreshing(true);
        setError(null);

        try {
            await fetchWalletData(walletAddress);
            await fetchTokens(walletAddress);
            window.dispatchEvent(new CustomEvent('wallet-refreshed'));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh wallet data';
            setError(errorMessage);
            console.error('Wallet refresh error:', {
                error: err,
                walletAddress,
                timestamp: new Date().toISOString()
            });
            throw err;
        } finally {
            setIsRefreshing(false);
        }
    }, [walletAddress, fetchWalletData, fetchTokens, isRefreshing]);

    const handleConnect = useCallback(async () => {
        setError(null);
        try {
            await connectWallet();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
            setError(errorMessage);
            console.error('Wallet connection error:', {
                error: err,
                timestamp: new Date().toISOString()
            });
            throw err;
        }
    }, [connectWallet]);

    const handleDisconnect = useCallback(async () => {
        setError(null);
        try {
            await disconnectWallet();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
            setError(errorMessage);
            console.error('Wallet disconnection error:', {
                error: err,
                timestamp: new Date().toISOString()
            });
            throw err;
        }
    }, [disconnectWallet]);

    // Calculate derived values
    const calculateTotalValue = useCallback(() => {
        let total = balance.value;
        tokens.forEach(token => {
            if (token.price && token.amount) {
                total += token.price * token.amount;
            }
        });
        return total;
    }, [balance.value, tokens]);

    return {
        // Wallet State
        walletAddress,
        isConnected,
        isLoading,
        error,
        lastUpdated,

        // Balance & Tokens
        balance,
        tokens,
        totalValue: calculateTotalValue(),

        // Actions
        connect: handleConnect,
        disconnect: handleDisconnect,
        refresh: handleRefresh,

        // UI State
        isRefreshing,
        setError
    };
} 