declare class WalletConnectManager {
    private walletConnectProvider;
    private walletConnectWeb3;
    ensureConnected(onConnected: () => void, onCancelled: () => void): Promise<void>;
    private setupWalletConnectProvider;
    sendCustomRequest(intentUrl: string): Promise<any>;
}
export declare const walletConnectManager: WalletConnectManager;
export {};
