export interface PhantomWindow extends Window {
    phantom?: {
        solana?: {
            connect(): Promise<{ publicKey: { toString(): string } }>;
            disconnect(): Promise<void>;
            isConnected: boolean;
            signMessage(message: Uint8Array, encoding: string): Promise<{ signature: Uint8Array }>;
            signAndSendTransaction(transaction: any): Promise<string>;
        };
    };
} 