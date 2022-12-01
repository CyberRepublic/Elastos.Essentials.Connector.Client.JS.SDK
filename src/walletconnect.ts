//import Web3 from "web3";
// HACK - Because wallet connect does not pop up the wallet when custom methods are sent
import { logger } from "@elastosfoundation/elastos-connectivity-sdk-js";
import WalletConnectProvider from "@walletconnect/web3-provider";

// https://docs.walletconnect.org/quick-start/dapps/web3-provider
class WalletConnectManager {
    private walletConnectProvider: WalletConnectProvider = null;
    //private walletConnectWeb3: Web3 = null;

    constructor() {
        this.createProvider();
    }

    private createProvider() {
        logger.log("Essentials connector: creating a new WC provider");

        // Create WalletConnect Provider inconditionally to let dapps be able to
        // check the WC status even without sending commands.
        this.walletConnectProvider = new WalletConnectProvider({
            //storageId: `${Math.random()}`, // Forces to reconnect to WC every time the app reloads. Not so convenient but "repairs" the WC link to the wallet
            rpc: {
                // Arbitrum
                42161: "https://arb1.arbitrum.io/rpc", // Arbitrum mainnet

                // Avalanche
                43114: "https://api.avax.network/ext/bc/C/rpc", // Avalanche mainnet
                43113: "https://api.avax-test.network/ext/bc/C/rpc", // Avalanche testnet

                // BNB smart chain
                56: "https://bsc-dataseed.binance.org", // BSC mainnet
                97: "https://data-seed-prebsc-1-s1.binance.org:8545", // BSC testnet

                // Cronos
                25: 'https://evm.cronos.org', // Cronos mainnet

                // Elastos
                20: "https://api.elastos.io/eth",           // Elastos ESC mainnet
                21: "https://api-testnet.elastos.io/eth",   // Elastos ESC testnet

                // Ethereum
                1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Ethereum mainnet
                5: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Ethereum goerli testnet

                // Fantom
                250: "https://rpcapi.fantom.network", // Fantom mainnet
                4002: "https://rpc.testnet.fantom.network", // Fantom testnet

                // Fuse
                122: 'https://rpc.fuse.io', // Fuse mainnet,

                // Fusion
                32659: 'https://mainnet.anyswap.exchange', // Fusion mainnet
                46688: 'https://testnet.fusionnetwork.io', // Fusion testnet

                // Gnosis
                100: 'https://dai.poa.network', // Gnosis mainnet

                // Heco
                128: "https://http-mainnet.hecochain.com",   // Heco mainnet
                256: "https://http-testnet.hecochain.com",   // Heco testnet

                // HSC
                70: 'https://http-mainnet2.hoosmartchain.com', // HOO smart chain mainnet
                170: 'https://http-testnet.hoosmartchain.com', // HOO smart chain testnet

                // IoTeX
                4689: 'https://babel-api.mainnet.iotex.io', // IoTeX mainnet
                4690: 'https://babel-api.testnet.iotex.io', // IoTeX testnet

                // Polygon
                137: "https://rpc-mainnet.maticvigil.com", // Polygon mainnet
                80001: "https://rpc-mumbai.maticvigil.com", // Polygon testnet

                // Telos
                40: 'https://mainnet.telos.net/evm', // Telos mainnet
                41: 'https://testnet.telos.net/evm' // Telos testnet
            },
            bridge: "https://walletconnect.elastos.net/v2",
            qrcodeModalOptions: {
                mobileLinks: [
                    // NOTE: We add this entry twice, because if added only once, the default WC modal
                    // is really not clear: the clickable top link to open essentials looks like a title,
                    // and a big QR code is shown in the middle. Users are lost. So, better show 2 Essentials
                    // links, better than that for now...
                    "essentials",
                    "essentials"
                ]
            }
            //bridge: "http://192.168.1.4:5002"
        });
    }

    /**
     * Sets additional custom RPC urls.
     */
    public setCustomRpcUrls(customRpcUrls: { chainId: number, rpcUrl: string }[]) {
        for (let entry of customRpcUrls) {
            this.walletConnectProvider.updateRpcUrl(entry.chainId, entry.rpcUrl);
        }
    }

    /**
     * Tells whether a wallet connect session exists on disk or not, not matter if it's connected
     * or not.
     */
    public hasWalletConnectSession(): boolean {
        return !!localStorage.getItem("walletconnect");
    }

    /**
     * Disconnects the active wallet connect session if any, and deletes any session from disk
     * in order to refresh start. This helps solving bad link states between dapps and wallets.
     */
    public async disconnectWalletConnect(): Promise<void> {
        logger.log("Clearing Essentials connector wallet connect");
        let connector = await this.walletConnectProvider.getWalletConnector();
        if (!this.walletConnectProvider || !connector)
            return;

        // Try to cleanly stop the session, if any.
        try {
            await connector.killSession();
        }
        catch (e) {
            logger.warn("Kill session error in :", e);
        }

        // IMPORTANT: the provider instance must be re-created otherwise, some cached info
        // remains and wallet connect keeps sending commands in new sessions, with topic ids of
        // the previous session!
        this.createProvider();

        logger.log("Wallet connect disconnection complete in the essentials connector");
    }

    /**
     * Makes sure that we are connected to Wallet Connect. If not, a wallet connect session
     * is started and user may have to scan a QR code to link to his device.
     */
    public async ensureConnected(onConnected: (didPhysicalConnection: boolean) => void, onCancelled: () => void) {
        // "Provider connected" = provider was enabled as web3 provider for future ethereum requests, but
        // we're not sure about the physical link.
        // "Connector connected" = web socket session link to essentials is established

        // iOS hack: on iOS (iOS 15 at least), safari cannot call a universal link (essentials')
        // 2 times from the same user action. the second attemp makes safari redirected to the web page
        // instead of re-opening essentials. To workaround this problem, we detect if we are currently
        // doing a "connect to WC + send custom url" combo. If so, if we just connected the websocket session,
        // the user is still in essentials so when we send the custom request just after, we remove
        // "essentials_url_intent" from WC's signing methods (the ones that make the universal link triggered).
        let needsPhysicalConnection = false;
        if (!this.walletConnectProvider.connector || !this.walletConnectProvider.connector.connected)
            needsPhysicalConnection = true;

        if (!this.walletConnectProvider || !this.walletConnectProvider.connected || !this.walletConnectProvider.connector || !this.walletConnectProvider.connector.connected) {
            let successfullyEnabled = await this.setupWalletConnectProvider();
            if (successfullyEnabled && this.walletConnectProvider.connected && this.walletConnectProvider.connector.connected) {
                onConnected(needsPhysicalConnection);
            }
            else
                onCancelled();
        }
        else {
            // Already connected
            onConnected(false);
        }
    }

    /**
     * Same as ensureConnected() except that the connected wallet application MUST be Elastos Essentials, not
     * another mobile wallet. This is typically used to ensure that the wallet will be able to handle
     * commands such as DID operations.
     */
    public async ensureConnectedToEssentials(onConnected: (didPhysicalConnection: boolean) => void, onCancelled: () => void): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ensureConnected(async (didPhysicalConnection) => {
                // Connected - Now check the peer info to make sure this is essentials.
                let wc = await this.walletConnectProvider.getWalletConnector();
                if (!wc.peerMeta || !wc.peerMeta.name || wc.peerMeta.name.toLowerCase().indexOf("essentials") < 0) {
                    reject(new Error("This operation is only supported when connected to the Elastos Essentials wallet."));
                }
                else {
                    onConnected(didPhysicalConnection);
                    resolve();
                }
            }, () => {
                onCancelled();
                resolve();
            });
        });
    }

    /**
     * See comments in ensureConnected(). If we just did a physical connection, don't trigger a deep link
     * during the upcoming custom request. For this, remove "essentials_url_intent" from signing methods in
     * WC.
     */
    public prepareSigningMethods(didPhysicalConnection: boolean) {
        // DIRTY! hacking the connector's internal instance of the global and public signingMethods
        // (cloned during connector's construction)
        // See walletconnect-monorepo/packages/clients/core/src/index.ts (v1.0 branch)
        let essentialsUrlIntentIndex = this.walletConnectProvider.connector['_signingMethods'].indexOf("essentials_url_intent");
        if (didPhysicalConnection && essentialsUrlIntentIndex >= 0) {
            this.walletConnectProvider.connector['_signingMethods'].splice(essentialsUrlIntentIndex, 1);
        }
        else if (!didPhysicalConnection && essentialsUrlIntentIndex === -1) {
            this.walletConnectProvider.connector['_signingMethods'].push("essentials_url_intent");
        }
    }

    /* private waitForAppToBeVisible(): Promise<void> {
        if (document.visibilityState === "visible")
            return; // Already visible, all good
        else {
            return new Promise<void>(resolve => {
                // Wait for visibility to come
                let listener = () => {
                    if (document.visibilityState === "visible") {
                        document.removeEventListener("visibilitychange", listener);
                        resolve();
                    }
                };
                document.addEventListener("visibilitychange", listener, false);
            });
        }
    } */

    private async setupWalletConnectProvider(): Promise<boolean> {
        // Enable session (triggers QR Code modal)
        console.log("Connecting to wallet connect", this.walletConnectProvider.connected, this.walletConnectProvider.connector.connected);

        let connected = await new Promise(async (resolve, reject) => {
            // Catch user cancellation in essentials (closed the WC session request screen) to reject
            // the promise.
            this.walletConnectProvider.wc.on("disconnect", (e, p) => {
                console.log("User cancelled the WC connection request in Essentials");
                this.hackyResetWCConnectingStatus();
                resolve(false);
            });

            try {
                let enabled = await this.walletConnectProvider.enable();
                console.log("CONNECTED to wallet connect", enabled, this.walletConnectProvider);

                resolve(true);
            }
            catch (e) {
                // User closed the qr code popup on the dapp side
                if (new String(e).indexOf("User closed modal") >= 0) {
                    this.hackyResetWCConnectingStatus();
                    resolve(false); // cancelled
                }
                else {
                    reject(e);
                }
            }
        });

        if (!connected)
            return false;

        // Be informed when a disconnection happens, so we can create a new provider to reconnect.
        // If we don't create a new provider, the old session remains used somehow and messages are lost
        this.walletConnectProvider.on("disconnect", () => {
            logger.log("Essentials connector: WC disconnect");
            this.createProvider();
        });

        //this.walletConnectWeb3 = new Web3(this.walletConnectProvider as any /* hack */);

        return true; // setup completed, enabled
    }

    private hackyResetWCConnectingStatus() {
        // HACK: reset provider's 'isConnecting' status by ourselves because this is not done by WC
        // when the qr code modal is cancelled. Without this, the modal doen't appear any more later.
        this.walletConnectProvider.isConnecting = false;
        if (this.walletConnectProvider.connector) {
            this.walletConnectProvider.connector["_handshakeId"] = 0;
            this.walletConnectProvider.connector["_handshakeTopic"] = "";
        }
    }

    /**
     * Force using an external WC provider instead of our own. Useful in apps that have to use wallet
     * connect independently as well.
     */
    public useWalletConnectProvider(provider: WalletConnectProvider) {
        // Just use it. Don't do any operation such as enable() on it.
        // Assume everything is done by the app.
        this.walletConnectProvider = provider;
        //this.walletConnectWeb3 = new Web3(this.walletConnectProvider as any /* hack */);
    }

    public getWalletConnectProvider(): WalletConnectProvider {
        return this.walletConnectProvider;
    }

    public async sendCustomRequest(intentUrl: string): Promise<any> {
        let connector = await this.walletConnectProvider.getWalletConnector();

        let request = {
            id: Math.floor(Math.random() * 1000000),
            jsonrpc: "2.0",
            method: "essentials_url_intent",
            params: [{
                url: intentUrl
            }]
        };

        console.log("Sending custom request to wallet connect", request);
        const result = await connector.sendCustomRequest(request);
        console.log("Got custom request response", result);
        return result;
    }
}

export const walletConnectManager = new WalletConnectManager();

