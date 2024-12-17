'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { getTokenAccounts, getSolanaBalance } from '@/app/utils/tokens';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
export interface TokenInfo {
    mint: string;
    amount: number;
    decimals: number;
    symbol: string;
    name: string;
    logo?: string;
    price?: number;
    verified?: boolean;
}

interface PhantomWindow extends Window {
    phantom?: {
        solana?: {
            connect(): Promise<{ publicKey: { toString(): string } }>;
            disconnect(): Promise<void>;
            isConnected: boolean;
            signMessage(message: Uint8Array, encoding: string): Promise<{ signature: Uint8Array }>;
        };
    };
}

export const connectPhantom = async (): Promise<string> => {
    const window = globalThis.window as PhantomWindow;
    const provider = window?.phantom?.solana;

    if (!provider) {
        window.open('https://phantom.app/', '_blank');
        throw new Error("Phantom provider not found");
    }

    const response = await provider.connect();
    return response.publicKey.toString();
};

export const disconnectPhantom = async (): Promise<void> => {
    const window = globalThis.window as PhantomWindow;
    const provider = window?.phantom?.solana;

    if (provider) {
        await provider.disconnect();
    }
};
interface WalletContextType {
    walletAddress: string;
    isConnected: boolean;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => Promise<void>;
    setWalletAddress: (address: string) => void;
    setIsConnected: (status: boolean) => void;
    balance: number;
    tokens: TokenInfo[];
    isLoading: boolean;
    lastUpdated: Date | null;
    fetchWalletData: (address: string) => Promise<void>;
}



const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [walletAddress, setWalletAddress] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [balance, setBalance] = useState<number>(0);
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchWalletData = async (address: string) => {
        try {
            setIsLoading(true);
            const balanceInLamports = await getSolanaBalance(address);
            setBalance(balanceInLamports / LAMPORTS_PER_SOL);
            const tokenData = await getTokenAccounts(address);
            setTokens(tokenData);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching wallet data:", error);
        } finally {
            setIsLoading(false);
        }
    };

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
            setBalance(0);
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
                isLoading,
                lastUpdated,
                fetchWalletData,
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