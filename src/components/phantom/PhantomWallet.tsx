'use client';

import { useState } from 'react';
import { useWallet } from '@/providers/WalletProvider';
import DraggableWrapper from '@/components/animation/gestures/DraggableWrapper';

export default function PhantomWalletButton() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        walletAddress,
        isConnected,
        connectWallet,
        disconnectWallet,
        balance,
        tokens,
        isLoading,
        lastUpdated,
        fetchWalletData
    } = useWallet();

    const handleRefresh = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        setError(null);

        try {
            await fetchWalletData(walletAddress);
            window.dispatchEvent(new CustomEvent('wallet-refreshed'));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh wallet data';
            setError(errorMessage);
            console.error('Wallet refresh error:', {
                error: err,
                walletAddress,
                timestamp: new Date().toISOString()
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const calculateTotalValue = () => {
        // Add SOL value
        let total = balance.value;

        // Add all token values
        tokens.forEach(token => {
            if (token.price && token.amount) {
                total += token.price * token.amount;
            }
        });

        return total;
    };

    return (
        <DraggableWrapper className="fixed top-4 right-4 w-96 font-mono z-50">
            <div className="bg-zinc-900/90 backdrop-blur-sm p-6 rounded-lg border border-zinc-800 shadow-xl">
                {!isConnected ? (
                    <button
                        onClick={connectWallet}
                        className="w-full bg-purple-900 text-white px-4 py-3 rounded-md hover:bg-purple-800 transition-colors flex items-center justify-center space-x-2"
                    >
                        <span>Connect Phantom Wallet</span>
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                            <div>
                                <p className="text-xs text-purple-400">WALLET ADDRESS</p>
                                <p className="text-sm font-medium text-gray-300 mt-1">
                                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                                </p>
                            </div>
                            <button
                                onClick={disconnectWallet}
                                className="bg-red-900/50 text-red-200 px-3 py-1 rounded-md text-sm hover:bg-red-800 transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-4">
                                <div className="animate-pulse text-purple-400">Loading wallet data...</div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-zinc-800/50 p-4 rounded-md">
                                    <h3 className="text-xs text-purple-400 mb-2">SOL BALANCE</h3>
                                    <div className="flex items-baseline">
                                        <p className="text-2xl font-bold text-white">{balance.uiBalance.toFixed(4)}</p>
                                        <p className="text-sm text-gray-400 ml-2">SOL</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        ≈ ${calculateTotalValue().toFixed(2)} USD
                                    </p>
                                </div>

                                {tokens.length > 0 && (
                                    <div className="bg-zinc-800/50 p-4 rounded-md">
                                        <h3 className="text-xs text-purple-400 mb-3">TOKENS ({tokens.length})</h3>
                                        <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                                            {tokens.map((token, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center p-2 hover:bg-zinc-700/30 rounded-md transition-colors"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        {token.logo ? (
                                                            <img
                                                                src={token.logo}
                                                                alt={token.symbol}
                                                                className="w-8 h-8 rounded-full"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png'
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-purple-900/30 flex items-center justify-center">
                                                                <span className="text-xs text-purple-300">
                                                                    {token.symbol.slice(0, 2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="flex items-center space-x-2">
                                                                <p className="text-sm text-gray-300 font-medium">
                                                                    {token.symbol}
                                                                </p>
                                                                {token.verified && (
                                                                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                                    </svg>
                                                                )}
                                                                <p className="text-xs text-gray-500">
                                                                    {token.amount.toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-gray-500">
                                                                {token.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {token.price ? (
                                                            <>
                                                                <p className="text-sm text-gray-300">
                                                                    ${(token.price * token.amount).toFixed(2)}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    ${token.price.toFixed(2)} per token
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="text-xs text-gray-500">Price unavailable</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-zinc-800">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Not updated yet'}
                                            </p>
                                            {error && (
                                                <p className="text-xs text-red-400 mt-1">{error}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            className={`text-purple-400 hover:text-purple-300 text-sm ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </DraggableWrapper>
    );
} 