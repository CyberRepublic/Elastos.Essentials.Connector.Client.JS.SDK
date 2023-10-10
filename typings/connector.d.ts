import { JSONObject, VerifiableCredential, VerifiablePresentation } from "@elastosfoundation/did-js-sdk";
import { DID, Interfaces, Wallet } from "@elastosfoundation/elastos-connectivity-sdk-js";
import WalletConnectProvider from "@walletconnect/web3-provider";
import type { provider } from "web3-core";
export type ConnectorOptions = {
    /**
     * List of custom RPC chain ID -> URL that the app supports.
     * This replaces or adds to the default rpc urls already provided by the connector by default.
     */
    customRpcUrls?: [
        {
            chainId: number;
            rpcUrl: string;
        }
    ];
};
export declare class EssentialsConnector implements Interfaces.Connectors.IConnector {
    name: string;
    private callbackURL;
    constructor(options?: ConnectorOptions);
    getDisplayName(): Promise<string>;
    getWeb3Provider(): provider;
    private registerResponseProcessors;
    registerResponseHandler(handler: Interfaces.Connectors.ConnectorResponseHandler): void;
    /**
     * Tells whether a wallet connect session exists on disk or not, not matter if it's connected
     * or not.
     */
    hasWalletConnectSession(): boolean;
    /**
     * Disconnects the active wallet connect session if any, and deletes any session from disk
     * in order to refresh start. This helps solving bad link states between dapps and wallets.
     */
    disconnectWalletConnect(): Promise<void>;
    /**
     * Force using an external WC provider instead of the one created by the essentials connector.
     * Calling this api is neede only in case the application already has its own provider and needs
     * to share it with this connector.
     */
    setWalletConnectProvider(provider: WalletConnectProvider): void;
    getWalletConnectProvider(): WalletConnectProvider;
    /**
     * DID API
     */
    getCredentials(query: any): Promise<any>;
    requestCredentials(request: DID.CredentialDisclosureRequest): Promise<VerifiablePresentation>;
    requestCredentialsV2(requestId: string, request: DID.CredentialDisclosureRequest): Promise<void>;
    issueCredential(holder: string, types: string[], subject: JSONObject, identifier?: string, expirationDate?: string): Promise<VerifiableCredential>;
    importCredentials(credentials: VerifiableCredential[], options?: DID.ImportCredentialOptions): Promise<DID.ImportedCredential[]>;
    importCredentialsV2(requestId: string, credentials: VerifiableCredential[], options?: DID.ImportCredentialOptions): Promise<void>;
    deleteCredentials(credentialIds: string[], options?: DID.DeleteCredentialOptions): Promise<string[]>;
    signData(data: string, jwtExtra?: any, signatureFieldName?: string): Promise<DID.SignedData>;
    requestPublish(): Promise<string>;
    updateHiveVaultAddress(vaultAddress: string, displayName: string): Promise<DID.UpdateHiveVaultAddressStatus>;
    importCredentialContext(serviceName: string, contextCredential: VerifiableCredential): Promise<DID.ImportedCredential>;
    generateAppIdCredential(appInstanceDID: string, appDID: string): Promise<any>;
    generateHiveBackupCredential?(sourceHiveNodeDID: string, targetHiveNodeDID: string, targetNodeURL: string): Promise<VerifiableCredential>;
    pay(query: any): Promise<Wallet.TransactionResult>;
    voteForDPoS(): Promise<void>;
    voteForCRCouncil(): Promise<void>;
    voteForCRProposal(): Promise<void>;
    sendSmartContractTransaction(payload: any): Promise<string>;
    /**
     * UI API
     */
    onBoard(feature: string, title: string, introduction: string, button: string): Promise<void>;
}
