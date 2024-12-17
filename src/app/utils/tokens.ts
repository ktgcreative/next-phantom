import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAccount, getMint } from '@solana/spl-token';

const connection = new Connection('https://solana-mainnet.rpc.extrnode.com/24c6319e-6696-4f0f-8ff1-2e83d7fe781e', {
    commitment: 'confirmed',
    httpHeaders: {
        'Content-Type': 'application/json',
    },
});

interface TokenMetadata {
    name: string;
    symbol: string;
    logo?: string;
    price?: number;
    verified?: boolean;
}

// Cache for token metadata
const metadataCache: { [key: string]: TokenMetadata } = {};
const JUPITER_API = 'https://token.jup.ag/all';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Price cache to avoid too many requests
const priceCache: { [key: string]: { price: number; timestamp: number } } = {};
const PRICE_CACHE_DURATION = 30 * 1000; // 30 seconds

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response;
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchWithRetry(url, retries - 1);
        }
        throw error;
    }
}

// Known tokens with their metadata
const KNOWN_TOKENS: { [key: string]: TokenMetadata } = {
    'SOL': {  // Native SOL
        name: 'Solana',
        symbol: 'SOL',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        verified: true,
        price: 0 // Will be updated from API
    },
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
        name: 'USD Coin',
        symbol: 'USDC',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        verified: true,
        price: 1 // USDC is pegged to USD
    },
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
        name: 'USDT',
        symbol: 'USDT',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
        verified: true,
        price: 1 // USDT is pegged to USD
    },
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
        name: 'Bonk',
        symbol: 'BONK',
        logo: 'https://arweave.net/hQB7PMqF_HZXfhOjwOPhW_3UKEZxWJACml-V_Ak9ALs',
        verified: true,
        price: 0 // Will be updated from API
    },
    'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': {
        name: 'Marinade Staked SOL',
        symbol: 'mSOL',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png',
        verified: true,
        price: 0 // Will be updated from API
    },
    'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a': {
        name: 'Raydium',
        symbol: 'RAY',
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
        verified: true,
        price: 0 // Will be updated from API
    }
};

// Known stablecoins that are always $1
const KNOWN_STABLECOINS = [
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
];

async function getTokenPrice(mint: string): Promise<number> {
    try {
        // Check cache first
        const now = Date.now();
        if (priceCache[mint] && (now - priceCache[mint].timestamp < PRICE_CACHE_DURATION)) {
            return priceCache[mint].price;
        }

        // Special handling for stablecoins
        if (KNOWN_STABLECOINS.includes(mint)) {
            return 1;
        }

        // Try Jupiter first
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
        } catch (e) {
            console.warn('Jupiter price fetch failed, trying DexScreener...');
        }

        // Try DexScreener as fallback
        try {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
            const data = await response.json();
            const price = data.pairs?.[0]?.priceUsd;
            if (price) {
                priceCache[mint] = { price: Number(price), timestamp: now };
                return Number(price);
            }
        } catch (e) {
            console.warn('DexScreener price fetch failed');
        }

        // Return cached price if available, otherwise 0
        return priceCache[mint]?.price || 0;
    } catch (error) {
        console.error(`All price fetching methods failed for ${mint}:`, error);
        return priceCache[mint]?.price || 0;
    }
}

// Update getTokenMetadata to use the new price fetching
async function getTokenMetadata(mint: string): Promise<TokenMetadata> {
    try {
        // Check cache first
        if (metadataCache[mint]) {
            // Update price even if metadata is cached
            metadataCache[mint].price = await getTokenPrice(mint);
            return metadataCache[mint];
        }

        // Get base metadata
        let metadata: TokenMetadata;
        if (KNOWN_TOKENS[mint]) {
            metadata = { ...KNOWN_TOKENS[mint] };
        } else {
            // Fetch from Jupiter if not a known token
            if (!metadataCache['__tokenList']) {
                try {
                    const response = await fetch(JUPITER_API, {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        cache: 'no-store'
                    });
                    const allTokens = await response.json();
                    metadataCache['__tokenList'] = allTokens;
                } catch (error) {
                    console.error('Error fetching token list:', error);
                    metadataCache['__tokenList'] = [];
                }
            }

            const tokenList = metadataCache['__tokenList'];
            const token = tokenList.find((t: any) => t.address === mint);

            metadata = {
                name: token?.name || 'Unknown Token',
                symbol: token?.symbol || '???',
                logo: token?.logoURI || null,
                verified: token?.tags?.includes('verified') || false,
                price: 0
            };
        }

        // Get latest price
        metadata.price = await getTokenPrice(mint);

        // Cache the result
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

// Update getSolPrice to use the new price fetching
async function getSolPrice(): Promise<number> {
    return getTokenPrice('SOL');
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

        // Get SOL balance first
        const solBalance = await connection.getBalance(publicKey);
        const solPrice = await getTokenPrice('SOL');

        const solToken = {
            mint: 'SOL',
            amount: solBalance / LAMPORTS_PER_SOL,
            decimals: 9,
            name: 'Solana',
            symbol: 'SOL',
            logo: KNOWN_TOKENS['SOL'].logo,
            price: solPrice,
            verified: true
        };

        // Get all token accounts
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: TOKEN_PROGRAM_ID },
            'confirmed'
        );

        // Filter and process token accounts
        const tokensWithMetadata = await Promise.all(
            tokenAccounts.value
                .filter(account => {
                    const amount = account.account.data.parsed.info.tokenAmount;
                    return amount.uiAmount > 0; // Only show tokens with balance
                })
                .map(async (account) => {
                    const parsedInfo = account.account.data.parsed.info;
                    const mint = parsedInfo.mint;
                    const tokenBalance = await getTokenBalance(connection, account.pubkey);
                    const metadata = await getTokenMetadata(mint);

                    if (!tokenBalance) return null;

                    return {
                        mint,
                        amount: tokenBalance.amount,
                        decimals: tokenBalance.decimals,
                        name: metadata.name,
                        symbol: metadata.symbol,
                        logo: metadata.logo,
                        price: metadata.price,
                        verified: metadata.verified
                    };
                })
        );

        // Filter out null values and combine with SOL
        const validTokens = tokensWithMetadata.filter(token => token !== null);
        const allTokens = [solToken, ...validTokens];

        // Sort tokens: verified first, then by value
        return allTokens.sort((a, b) => {
            if (a.verified !== b.verified) {
                return a.verified ? -1 : 1;
            }
            const aValue = (a.price || 0) * (a.amount || 0);
            const bValue = (b.price || 0) * (b.amount || 0);
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
        return balance;
    } catch (error) {
        console.error('Error fetching SOL balance:', error);
        return 0;
    }
}

async function getDexScreenerPrice(mint: string): Promise<number> {
    try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
        const data = await response.json();
        return data.pairs?.[0]?.priceUsd || 0;
    } catch (error) {
        console.warn(`DexScreener price fetch failed for ${mint}:`, error);
        return 0;
    }
}

async function getBirdeyePrice(mint: string): Promise<number> {
    try {
        const response = await fetch(`https://public-api.birdeye.so/public/price?address=${mint}`, {
            headers: {
                'X-API-KEY': 'YOUR_API_KEY',  // You'll need to get an API key
                'Content-Type': 'application/json',
            }
        });
        const data = await response.json();
        return data.data?.value || 0;
    } catch (error) {
        console.warn(`Birdeye price fetch failed for ${mint}:`, error);
        return 0;
    }
} 