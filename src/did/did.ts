export class DID {
    static getCredentials(query: any): Promise<any> {
        return new Promise(async (resolve, reject)=>{
            /*let res: { result: { presentation: DIDPlugin.VerifiablePresentation } };
            res = await intentPlugin.sendIntent("https://did.elastos.net/credaccess", query);

            if (!res || !res.result || !res.result.presentation) {
                console.warn("Missing presentation. The operation was maybe cancelled.");
                resolve(null);
                return;
            }

            resolve(res.result.presentation);*/
        });
    }

    static generateAppIDCredential(appInstanceDID: string, appDID: string): Promise<any> {
        console.log("Essentials: app ID Credential generation flow started");

        return new Promise(async (resolve, reject)=>{
            try {
                // No such credential, so we have to create one. Send an intent to get that from the did app
                /*let res: { result: { credential: string } } = await intentPlugin.sendIntent("https://did.elastos.net/appidcredissue", {
                    appinstancedid: appInstanceDID,
                    appdid: appDID
                });

                console.log("Got response for the appidcredissue intent", res);

                if (!res || !res.result || !res.result.credential) {
                    console.warn("Missing credential information. The operation was maybe cancelled.");
                    resolve(null);
                    return;
                }
                let credential = didManager.VerifiableCredentialBuilder.fromJson(res.result.credential);
                resolve(credential);*/
            }
            catch (err) {
                console.error("generateAppIDCredential() error:", err);
                resolve(null);
            }
        });
    }
}