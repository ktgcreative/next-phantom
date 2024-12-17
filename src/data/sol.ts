import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAccount, getMint } from '@solana/spl-token';

// Types
export interface TokenMetadata {
    name: string;
    symbol: string;
    logo?: string;
    price?: number;
    verified?: boolean;
}

export interface TokenInfo {
    mint: string;
    amount: number;
    decimals: number;
    symbol: string;
    name: string;
    logo?: string;
    price?: number;
    verified?: boolean;
    value?: number;
}

interface JupiterToken {
    address: string;
    name: string;
    symbol: string;
    logoURI?: string;
    tags?: string[];
}

// Constants
const connection = new Connection('https://solana-mainnet.rpc.extrnode.com/24c6319e-6696-4f0f-8ff1-2e83d7fe781e', {
    commitment: 'confirmed',
    httpHeaders: {
        'Content-Type': 'application/json',
    },
});

const JUPITER_API = 'https://token.jup.ag/all';
const PRICE_CACHE_DURATION = 30 * 1000; // 30 seconds

// Cache
const metadataCache: { [key: string]: TokenMetadata } & { __tokenList?: JupiterToken[] } = {};
const priceCache: { [key: string]: { price: number; timestamp: number } } = {};

// Known tokens and constants
const KNOWN_TOKENS: { [key: string]: TokenMetadata } = {
    'So11111111111111111111111111111111111111112': {
        name: 'Solana',
        symbol: 'SOL',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        verified: true,
        price: 0
    },
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
        name: 'USD Coin',
        symbol: 'USDC',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        verified: true,
        price: 1
    },
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
        name: 'USDT',
        symbol: 'USDT',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
        verified: true,
        price: 1
    },
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
        name: 'Bonk',
        symbol: 'BONK',
        logo: 'https://arweave.net/hQB7PMqF_HZXfhOjwOPhW_3UKEZxWJACml-V_Ak9ALs',
        verified: true,
        price: 0
    },
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': {
        name: 'Marinade Staked SOL',
        symbol: 'mSOL',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
        verified: true,
        price: 0
    },
    'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a': {
        name: 'Raydium',
        symbol: 'RAY',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
        verified: true,
        price: 0
    }
};

const KNOWN_STABLECOINS = [
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
];

// Utility functions
async function getTokenPrice(mint: string): Promise<number> {
    try {
        const solMint = 'So11111111111111111111111111111111111111112';
        const mintToCheck = mint === 'SOL' ? solMint : mint;

        const now = Date.now();
        if (priceCache[mintToCheck] && (now - priceCache[mintToCheck].timestamp < PRICE_CACHE_DURATION)) {
            return priceCache[mintToCheck].price;
        }

        if (KNOWN_STABLECOINS.includes(mint)) {
            return 1;
        }

        try {
            const response = await fetch(`https://price.jup.ag/v4/price?ids=${mint}`);
            if (response.ok) {
                const data = await response.json();
                const price = data.data?.[mint]?.price;
                if (price) {
                    priceCache[mint] = { price, timestamp: now };
                    return price;
                }
            }
        } catch {
            console.warn('Jupiter price fetch failed, trying DexScreener...');
        }

        try {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
            const data = await response.json();
            const price = data.pairs?.[0]?.priceUsd;
            if (price) {
                priceCache[mint] = { price: Number(price), timestamp: now };
                return Number(price);
            }
        } catch {
            console.warn('DexScreener price fetch failed');
        }

        return priceCache[mint]?.price || 0;
    } catch (error) {
        console.error(`Price fetching failed for ${mint}:`, error);
        return priceCache[mint]?.price || 0;
    }
}

async function getTokenMetadata(mint: string): Promise<TokenMetadata> {
    try {
        if (metadataCache[mint]) {
            metadataCache[mint].price = await getTokenPrice(mint);
            return metadataCache[mint];
        }

        let metadata: TokenMetadata;
        if (KNOWN_TOKENS[mint]) {
            metadata = { ...KNOWN_TOKENS[mint] };
        } else {
            if (!metadataCache.__tokenList) {
                try {
                    const response = await fetch(JUPITER_API, {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        cache: 'no-store'
                    });
                    metadataCache.__tokenList = await response.json() as JupiterToken[];
                } catch (error) {
                    console.error('Error fetching token list:', error);
                    metadataCache.__tokenList = [];
                }
            }

            const token = metadataCache.__tokenList?.find((t) => t.address === mint);

            metadata = {
                name: token?.name || 'Unknown Token',
                symbol: token?.symbol || '???',
                logo: token?.logoURI || undefined,
                verified: token?.tags?.includes('verified') || false,
                price: 0
            };
        }

        metadata.price = await getTokenPrice(mint);
        metadataCache[mint] = metadata;
        return metadata;
    } catch (error) {
        console.error('Error fetching token metadata:', error);
        return {
            name: 'Unknown Token',
            symbol: '???',
            price: 0,
            verified: false
        };
    }
}

async function getTokenBalance(connection: Connection, tokenAccount: PublicKey) {
    try {
        const info = await getAccount(connection, tokenAccount);
        const amount = Number(info.amount);
        const mint = await getMint(connection, info.mint);
        const balance = amount / (10 ** mint.decimals);
        return {
            amount: balance,
            decimals: mint.decimals,
            mint: info.mint.toBase58()
        };
    } catch (error) {
        console.error('Error getting token balance:', error);
        return null;
    }
}

export async function getTokenAccounts(walletAddress: string) {
    try {
        const publicKey = new PublicKey(walletAddress);

        const solBalance = await connection.getBalance(publicKey);
        const solMetadata = await getTokenMetadata('So11111111111111111111111111111111111111112');
        const solPrice = Number(solMetadata.price) || 0;
        const solAmount = Number(solBalance) / LAMPORTS_PER_SOL;

        const solToken = {
            mint: 'So11111111111111111111111111111111111111112',
            amount: solAmount,
            decimals: 9,
            name: solMetadata.name || 'Solana',
            symbol: solMetadata.symbol || 'SOL',
            logo: solMetadata.logo || KNOWN_TOKENS['So11111111111111111111111111111111111111112'].logo,
            price: solPrice,
            value: solAmount * solPrice,
            verified: true
        };

        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: TOKEN_PROGRAM_ID },
            'confirmed'
        );

        const tokensWithMetadata = await Promise.all(
            tokenAccounts.value
                .filter(account => {
                    const amount = account.account.data.parsed.info.tokenAmount;
                    return Number(amount.uiAmount) > 0;
                })
                .map(async (account) => {
                    const parsedInfo = account.account.data.parsed.info;
                    const mint = parsedInfo.mint;
                    const tokenBalance = await getTokenBalance(connection, account.pubkey);
                    const metadata = await getTokenMetadata(mint);

                    if (!tokenBalance) return null;

                    const amount = Number(tokenBalance.amount);
                    const price = Number(metadata.price) || 0;
                    const value = amount * price;

                    return {
                        mint,
                        amount,
                        decimals: tokenBalance.decimals,
                        name: metadata.name,
                        symbol: metadata.symbol,
                        logo: metadata.logo,
                        price,
                        value,
                        verified: metadata.verified
                    };
                })
        );

        const validTokens = tokensWithMetadata.filter((token): token is NonNullable<typeof token> => token !== null);
        const allTokens = [solToken, ...validTokens];

        return allTokens.sort((a, b) => {
            if (a.verified !== b.verified) {
                return a.verified ? -1 : 1;
            }
            const aValue = Number(a.value) || 0;
            const bValue = Number(b.value) || 0;
            return bValue - aValue;
        });

    } catch (error) {
        console.error('Error fetching token accounts:', error);
        return [];
    }
}

export async function getSolanaBalance(walletAddress: string) {
    try {
        const publicKey = new PublicKey(walletAddress);
        const balance = await connection.getBalance(publicKey);
        const solMetadata = await getTokenMetadata('So11111111111111111111111111111111111111112');
        const uiBalance = Number(balance) / LAMPORTS_PER_SOL;
        const price = Number(solMetadata.price) || 0;

        return {
            balance: Number(balance),
            uiBalance: Number(uiBalance.toFixed(9)),
            price: price,
            value: Number((uiBalance * price).toFixed(2))
        };
    } catch (error) {
        console.error('Error fetching SOL balance:', error);
        return {
            balance: 0,
            uiBalance: 0,
            price: 0,
            value: 0
        };
    }
}

// Phantom wallet functions
export interface PhantomWindow extends Window {
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