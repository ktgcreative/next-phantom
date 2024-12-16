import { Transaction } from '@solana/web3.js';

export interface PhantomWindow extends Window {
    phantom?: {
        solana?: {
            connect(): Promise<{ publicKey: { toString(): string } }>;
            disconnect(): Promise<void>;
            isConnected: boolean;
            signMessage(message: Uint8Array, encoding: string): Promise<{ signature: Uint8Array }>;
            signAndSendTransaction(transaction: Transaction): Promise<string>;
        };
    };
} 