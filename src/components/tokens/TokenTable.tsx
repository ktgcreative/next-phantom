'use client';

import { TokenInfo } from '@/data/sol';
import StaggerContainer from '../animation/containers/StaggerContainer';
import TokenCard from './TokenCard';
import SlideInContainer from '../animation/containers/SlideInContainer';
import FadeInContainer from '../animation/containers/FadeInContainer';
import AnimatedButton from '../animation/buttons/AnimatedButton';

interface TokenTableProps {
    tokens: TokenInfo[];
    isLoading: boolean;
    totalValue: number;
    onRefresh: () => void;
}

export default function TokenTable({ tokens, isLoading, totalValue, onRefresh }: TokenTableProps) {
    return (
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
                    onClick={onRefresh}
                    disabled={isLoading}
                >
                    Refresh Assets
                </AnimatedButton>
            </FadeInContainer>
        </div>
    );
} 