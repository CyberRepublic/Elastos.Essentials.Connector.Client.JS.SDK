import { JSONObject, VerifiableCredential, VerifiablePresentation } from "@elastosfoundation/did-js-sdk";
import { DID, Interfaces, Wallet } from "@elastosfoundation/elastos-connectivity-sdk-js";
import WalletConnectProvider from "@walletconnect/web3-provider";
import type { provider } from "web3-core";
import { DID as ConnDID } from "./did/did";
import { setResponseHandler } from "./response-processor";
import { UX } from "./ux/ux";
import { Wallet as ConnWallet } from "./wallet/wallet";
import { walletConnectManager } from "./walletconnect";

export type ConnectorOptions = {
    /**
     * List of custom RPC chain ID -> URL that the app supports.
     * This replaces or adds to the default rpc urls already provided by the connector by default.
     */
    customRpcUrls?: [
        { chainId: number, rpcUrl: string }
    ]
}

export class EssentialsConnector implements Interfaces.Connectors.IConnector {
    public name: string = "essentials";

    private callbackURL: string = null;

    constructor(options?: ConnectorOptions) {
        if (options && options.customRpcUrls)
            walletConnectManager.setCustomRpcUrls(options.customRpcUrls);

        this.registerResponseProcessors();
    }

    async getDisplayName(): Promise<string> {
        return "Elastos Essentials";
    }

    getWeb3Provider(): provider {
        return walletConnectManager.getWalletConnectProvider() as any;
    }

    private registerResponseProcessors() {
        ConnDID.registerResponseProcessors();
    }

    registerResponseHandler(handler: Interfaces.Connectors.ConnectorResponseHandler) {
        console.log("Registered response handler on the Essential connector");
        setResponseHandler(handler);
    }

    /**
     * Tells whether a wallet connect session exists on disk or not, not matter if it's connected
     * or not.
     */
    public hasWalletConnectSession(): boolean {
        return walletConnectManager.hasWalletConnectSession();
    }

    /**
     * Disconnects the active wallet connect session if any, and deletes any session from disk
     * in order to refresh start. This helps solving bad link states between dapps and wallets.
     */
    public disconnectWalletConnect(): Promise<void> {
        return walletConnectManager.disconnectWalletConnect();
    }

    /**
     * Force using an external WC provider instead of the one created by the essentials connector.
     * Calling this api is neede only in case the application already has its own provider and needs
     * to share it with this connector.
     */
    public setWalletConnectProvider(provider: WalletConnectProvider) {
        walletConnectManager.useWalletConnectProvider(provider);
    }

    public getWalletConnectProvider(): WalletConnectProvider {
        return walletConnectManager.getWalletConnectProvider();
    }

    /**
     * DID API
     */
    getCredentials(query: any): Promise<any> {
        return ConnDID.getCredentials(query);
    }

    requestCredentials(request: DID.CredentialDisclosureRequest): Promise<VerifiablePresentation> {
        return ConnDID.requestCredentials(request);
    }

    requestCredentialsV2(requestId: string, request: DID.CredentialDisclosureRequest): Promise<void> {
        return ConnDID.requestCredentialsV2(requestId, request);
    }

    issueCredential(holder: string, types: string[], subject: JSONObject, identifier?: string, expirationDate?: string): Promise<VerifiableCredential> {
        return ConnDID.issueCredential(holder, types, subject, identifier, expirationDate);
    }

    importCredentials(credentials: VerifiableCredential[], options?: DID.ImportCredentialOptions): Promise<DID.ImportedCredential[]> {
        return ConnDID.importCredentials(credentials, options);
    }

    importCredentialsV2(requestId: string, credentials: VerifiableCredential[], options?: DID.ImportCredentialOptions): Promise<void> {
        return ConnDID.importCredentialsV2(requestId, credentials, options);
    }

    deleteCredentials(credentialIds: string[], options?: DID.DeleteCredentialOptions): Promise<string[]> {
        return ConnDID.deleteCredentials(credentialIds, options);
    }

    signData(data: string, jwtExtra?: any, signatureFieldName?: string): Promise<DID.SignedData> {
        return ConnDID.signData(data, jwtExtra, signatureFieldName);
    }

    requestPublish(): Promise<string> {
        return ConnDID.requestPublish();
    }

    updateHiveVaultAddress(vaultAddress: string, displayName: string): Promise<DID.UpdateHiveVaultAddressStatus> {
        return ConnDID.updateHiveVaultAddress(vaultAddress, displayName);
    }

    importCredentialContext(serviceName: string, contextCredential: VerifiableCredential): Promise<DID.ImportedCredential> {
        return ConnDID.importCredentialContext(serviceName, contextCredential);
    }

    generateAppIdCredential(appInstanceDID: string, appDID: string): Promise<any> {
        return ConnDID.generateAppIDCredential(appInstanceDID, appDID);
    }

    generateHiveBackupCredential?(sourceHiveNodeDID: string, targetHiveNodeDID: string, targetNodeURL: string): Promise<VerifiableCredential> {
        return ConnDID.generateHiveBackupCredential(sourceHiveNodeDID, targetHiveNodeDID, targetNodeURL);
    }

    pay(query: any): Promise<Wallet.TransactionResult> {
        return ConnWallet.pay(query);
    }

    voteForDPoS(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    voteForCRCouncil(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    voteForCRProposal(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    sendSmartContractTransaction(payload: any): Promise<string> {
        throw new Error("Method not implemented.");
    }

    /**
     * UI API
     */
    onBoard(feature: string, title: string, introduction: string, button: string) {
        return UX.onBoard(feature, title, introduction, button);
    }
}