# Auto Phantom 👻

A modern Solana wallet interface built with Next.js and Phantom Wallet integration. Features real-time token tracking and portfolio management.

## 🌟 Features

### Phantom Wallet Integration
- **Seamless Connection**: Easily connect your Phantom wallet with a single click using Phantom's Web3 provider.
- **Auto Detection**: Automatically detects if the Phantom wallet is installed, enhancing user experience.
- **Secure Authentication**: Utilizes Phantom's secure authentication flow to ensure safe wallet interactions.
- **Real-time Updates**: Automatically updates your balance and token information in response to wallet events.

### Solana Data Management
- **Token Tracking**: Monitor your SOL and SPL tokens in real-time, keeping you informed about your holdings.
- **Price Feeds**: Integrates with Jupiter and DexScreener APIs to provide accurate and up-to-date token pricing.
- **Metadata Handling**: Implements a smart caching system for token metadata and prices to optimize performance.
- **Performance Optimized**: Efficiently fetches data with intelligent caching strategies to ensure a smooth user experience.

## 🏗 Architecture

### Wallet Provider (`src/providers/PhantomProvider.tsx`)
The `PhantomProvider` leverages `@solana/web3.js` and `@solana/spl-token` to manage wallet interactions and data fetching. It handles:
- **Connection Management**: Utilizes Phantom's Web3 provider to connect and disconnect wallets seamlessly.
- **Balance and Token Management**: Fetches and updates SOL and SPL token balances using Solana's web3 APIs.
- **Event Handling**: Listens to wallet events to keep the UI in sync with the wallet's state.

### Solana Data Layer (`src/data/sol.ts`)
The data layer utilizes `@solana/web3.js` and `@solana/spl-token` to interact with the Solana blockchain:
- **Token Account Queries**: Fetches token account details and balances using Solana's Web3 APIs.
- **Balance Fetching**: Retrieves SOL balance and updates using real-time blockchain data.
- **Price Aggregation**: Integrates with external APIs like Jupiter and DexScreener to aggregate and update token prices.
- **Metadata Caching**: Implements caching strategies to store token metadata, reducing API calls and enhancing performance.

### Phantom Integration
Auto Phantom integrates with Phantom's Web3 provider to handle wallet functionalities:
- **Wallet Connection**: Uses Phantom's API to establish and manage wallet connections.
- **Secure Transactions**: Facilitates secure signing of transactions via Phantom's authentication.
- **Account Management**: Manages user accounts, ensuring secure and efficient interactions with the Solana blockchain.

#### Provider Interface
Defines the structure and methods provided by Phantom's Web3 provider, ensuring seamless integration with the application.

```typescript
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
```

#### Connection Management
Handles the logic for establishing and terminating connections with the Phantom wallet using Solana's Web3 APIs.

```typescript
// Connect to Phantom wallet
export const connectPhantom = async (): Promise<string> => {
    const provider = window?.phantom?.solana;
    const response = await provider.connect();
    return response.publicKey.toString();
};

// Disconnect from Phantom wallet
export const disconnectPhantom = async (): Promise<void> => {
    const provider = window?.phantom?.solana;
    if (provider) {
        await provider.disconnect();
    }
};
```

#### Event Handling
Manages wallet events to ensure the application responds appropriately to changes in wallet status:
- **`wallet-refreshed`**: Updates token balances when the wallet data is refreshed.
- **`connect`**: Updates the application state upon successful wallet connection.
- **`disconnect`**: Resets wallet state when disconnected.
- **`accountChanged`**: Fetches new data when the user switches accounts.

#### State Management
Utilizes React Context to efficiently manage and distribute wallet state across the application components.

```typescript
const [walletAddress, setWalletAddress] = useState('');
const [isConnected, setIsConnected] = useState(false);
const [balance, setBalance] = useState({
    balance: 0,
    uiBalance: 0,
    price: 0,
    value: 0
});
```

#### Error Handling
Incorporates comprehensive error handling to address potential issues:
- **Phantom Not Installed**: Notifies users and provides links to install Phantom if not detected.
- **User Rejected Connection**: Informs users if they decline to connect their wallet.
- **Network Issues**: Detects and manages connectivity problems to maintain application stability.
- **Invalid Responses**: Ensures data integrity by handling unexpected API responses.

#### Security Considerations
Maintains robust security measures to protect user data and assets:
- **Phantom Installation Verification**: Automatically detects Phantom to secure wallet interactions.
- **Provider Validation**: Ensures the Phantom provider is legitimate before engaging in any operations.
- **Sensitive Data Protection**: Does not store private keys or sensitive information on the client or server.
- **Client-Side Operations**: Handles all wallet interactions exclusively on the client side to minimize security risks.

## 🔧 Technical Implementation

### Data Flow
1. **User Connects Phantom Wallet**: The user initiates the wallet connection through the UI.
2. **`PhantomProvider` establishes the connection**: Utilizes Phantom's API to authenticate and manage the wallet session.
3. **`sol.ts` interacts with Solana's Web3 APIs**: Fetches token data, balances, and interacts with the blockchain.
4. **UI Reflects Real-Time Data**: Updates the interface dynamically based on the latest wallet and blockchain data.

### Caching Strategy
- **Token Metadata Caching**: Stores token information to minimize redundant API requests and enhance performance.
- **Price Data Caching**: Implements a 30-second TTL cache to maintain up-to-date pricing without overloading APIs.
- **Real-Time Balance Updates**: Continuously fetches and updates wallet balances to provide accurate financial data.

### Price Aggregation
Utilizes multiple APIs to aggregate and ensure accurate token pricing:
1. **Jupiter API (Primary Source)**: Fetches reliable price data from Jupiter's APIs.
2. **DexScreener (Secondary Source)**: Serves as a fallback to obtain prices if Jupiter API is unavailable.
3. **Stable Coin Pricing**: Uses predefined prices for stable coins to ensure consistent and accurate valuations.



## 📦 Dependencies

Auto Phantom utilizes the following core packages to deliver its functionalities:

- **`@solana/web3.js`**: Facilitates interactions with the Solana blockchain, enabling wallet connections, transactions, and data fetching.
- **`@solana/spl-token`**: Manages SPL tokens on Solana, allowing for token tracking and balance management.
- **Next.js 15.1+**: Provides the React framework with server-side rendering and optimized performance for building scalable web applications.
- **TypeScript**: Ensures type safety and enhances developer experience with robust type-checking features.
- **TailwindCSS**: Offers a utility-first CSS framework for rapid and responsive UI development.

## 🔐 Security

Auto Phantom incorporates industry-standard security practices to safeguard user assets and information:

- **Phantom Wallet Security**: All private key operations are handled securely within the Phantom wallet, ensuring keys are never exposed to the application.
- **Transaction Confirmation**: Requires explicit user approval for all transactions, preventing unauthorized actions.
- **Trusted RPC Endpoints**: Connects to verified Solana RPC endpoints to ensure secure and reliable blockchain interactions.
- **Client-Side Operations**: All wallet interactions are executed on the client side, minimizing potential attack surfaces.

### Custom Hooks

#### `useTokens` Hook (`src/hooks/useTokens.ts`)
The `useTokens` hook provides a streamlined way to manage token data within the application:

**Key Features:**
- **Data Fetching**: Utilizes `@solana/web3.js` to fetch token accounts and balances.
- **State Management**: Manages `tokens`, `isLoading`, and `totalValue` states.
- **Event Handling**: Listens for wallet events to refresh token data automatically.

**Usage:**
```typescript
const { tokens, isLoading, totalValue, fetchTokens } = useTokens();
```

#### `usePhantom` Hook (`src/hooks/usePhantom.ts`)
The `usePhantom` hook provides comprehensive wallet management functionality with built-in error handling and UI states:

**Features:**
- **Wallet State Management**: Handles connection status, address, and balance
- **Error Handling**: Built-in error management for wallet operations
- **Auto-refresh**: Listens for account changes and updates data
- **Loading States**: Manages loading and refreshing states for better UX

**Interface:**
```typescript
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
```

**Usage:**
```typescript
const {
    walletAddress,
    isConnected,
    balance,
    tokens,
    totalValue,
    isLoading,
    isRefreshing,
    error,
    connect,
    disconnect,
    refresh
} = usePhantom();
```

**Benefits:**
- Centralized wallet management
- Automatic error handling
- Real-time updates
- Loading state management
- Type-safe interface
- Comprehensive token value calculations
