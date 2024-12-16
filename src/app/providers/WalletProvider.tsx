'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface WalletContextType {
    walletAddress: string;
    isConnected: boolean;
    setWalletAddress: (address: string) => void;
    setIsConnected: (status: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [walletAddress, setWalletAddress] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    return (
        <WalletContext.Provider
            value={{
                walletAddress,
                isConnected,
                setWalletAddress,
                setIsConnected,
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