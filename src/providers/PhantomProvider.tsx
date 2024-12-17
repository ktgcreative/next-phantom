'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
    TokenInfo,
    getTokenAccounts,
    getSolanaBalance,
    connectPhantom,
    disconnectPhantom
} from '@/data/sol';

interface WalletContextType {
    walletAddress: string;
    isConnected: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => Promise<void>;
    setWalletAddress: (address: string) => void;
    setIsConnected: (status: boolean) => void;
    balance: {
        balance: number;
        uiBalance: number;
        price: number;
        value: number;
    };
    tokens: TokenInfo[];
    totalValue: number;
    isLoading: boolean;
    lastUpdated: Date | null;
    fetchWalletData: (address: string) => Promise<void>;
    fetchTokens: (address: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);


export function WalletProvider({ children }: { children: ReactNode }) {
    const [walletAddress, setWalletAddress] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [balance, setBalance] = useState<{
        balance: number;
        uiBalance: number;
        price: number;
        value: number;
    }>({
        balance: 0,
        uiBalance: 0,
        price: 0,
        value: 0
    });
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [totalValue, setTotalValue] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchTokens = async (address: string) => {
        try {
            setIsLoading(true);
            const tokenData = await getTokenAccounts(address);
            setTokens(tokenData);

            // Calculate total portfolio value including SOL
            const tokenValue = tokenData.reduce((acc, token) => {
                return acc + (token.price || 0) * (token.amount || 0);
            }, 0);
            const totalValue = tokenValue + balance.value;
            setTotalValue(totalValue);

            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching tokens:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWalletData = async (address: string) => {
        try {
            setIsLoading(true);
            const balanceData = await getSolanaBalance(address);
            setBalance(balanceData);
            await fetchTokens(address);
        } catch (error) {
            console.error("Error fetching wallet data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Add wallet refresh event listener
    useEffect(() => {
        const handleWalletRefresh = () => {
            if (walletAddress) {
                fetchWalletData(walletAddress);
            }
        };

        window.addEventListener('wallet-refreshed', handleWalletRefresh);
        return () => {
            window.removeEventListener('wallet-refreshed', handleWalletRefresh);
        };
    }, [walletAddress]);

    const connectWallet = async () => {
        try {
            const address = await connectPhantom();
            setWalletAddress(address);
            setIsConnected(true);
            await fetchWalletData(address);
        } catch (error) {
            console.error("Error connecting to wallet:", error);
        }
    };

    const disconnectWalletHandler = async () => {
        try {
            await disconnectPhantom();
            setWalletAddress('');
            setIsConnected(false);
            setBalance({
                balance: 0,
                uiBalance: 0,
                price: 0,
                value: 0
            });
            setTokens([]);
            setLastUpdated(null);
        } catch (error) {
            console.error("Error disconnecting wallet:", error);
        }
    };

    return (
        <WalletContext.Provider
            value={{
                walletAddress,
                isConnected,
                connectWallet,
                disconnectWallet: disconnectWalletHandler,
                setWalletAddress,
                setIsConnected,
                balance,
                tokens,
                totalValue,
                isLoading,
                lastUpdated,
                fetchWalletData,
                fetchTokens,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
} 