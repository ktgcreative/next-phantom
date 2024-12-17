'use client';

import useTokens from '@/hooks/useTokens';
import PhantomWalletButton from '@/components/phantom/PhantomWallet';
import SlideInContainer from '@/components/animation/containers/SlideInContainer';
import TokenTable from '@/components/tokens/TokenTable';

export default function TokensPage() {
    const { tokens, isLoading, totalValue } = useTokens();

    return (
        <div className="min-h-screen bg-black text-white font-mono">
            <div className="container mx-auto px-4 py-8 relative z-0">
                <PhantomWalletButton />

                {tokens.length > 0 ? (
                    <TokenTable
                        tokens={tokens}
                        isLoading={isLoading}
                        totalValue={totalValue}
                        onRefresh={() => { /* Implement refresh logic if needed */ }}
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