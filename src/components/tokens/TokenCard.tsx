'use client';

import { TokenInfo } from '@/providers/WalletProvider';
import StaggerItem from '../animation/items/StaggerItem';

interface TokenCardProps {
    token: TokenInfo;
}

export default function TokenCard({ token }: TokenCardProps) {
    return (
        <StaggerItem className="p-4 hover:bg-zinc-800/50 transition-colors">
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
        </StaggerItem>
    );
} 