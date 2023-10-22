import { DIDURL, JSONObject, VerifiableCredential, VerifiablePresentation } from "@elastosfoundation/did-js-sdk";
import { DID as SDKDID } from "@elastosfoundation/elastos-connectivity-sdk-js";
import { ImportedCredential } from "@elastosfoundation/elastos-connectivity-sdk-js/typings/did";
import { IntentEntity } from "../intent/intent";
import { IntentType } from "../intent/intent-type";
import { processIntentResponse, registerIntentResponseProcessor } from "../response-processor";
import { getSafeApplicationDID } from "../utils";
import { walletConnectManager } from "../walletconnect";
import { AppIDCredentialRequest } from "./appidcredentialrequest";
import { DeleteCredentialsRequest } from "./deletecredentialsrequest";
import { GetCredentialsRequest } from "./getcredentialsrequest";
import { HiveBackupCredentialRequest, HiveBackupCredentialResponse } from "./hivebackupcredentialrequest";
import { ImportCredentialContextRequest } from "./importcredentialcontextrequest";
import { ImportCredentialsRequest } from "./importcredentialsrequest";
import { IssueCredentialRequest } from "./issuecredentialrequest";
import { RequestCredentialsRequest } from "./requestcredentialsrequest";
import { RequestPublishRequest } from "./requestpublishrequest";
import { SignDataRequest } from "./signdatarequest";
import { UpdateHiveVaultAddressRequest } from "./updatehivevaultaddressrequest";

export class DID {
  static registerResponseProcessors() {
      registerIntentResponseProcessor(IntentType.REQUEST_CREDENTIALS, DID.processRequestCredentialsResponse);
      registerIntentResponseProcessor(IntentType.IMPORT_CREDENTIALS, DID.processImportCredentialsResponse);
  }

    static getCredentials(query: any): Promise<VerifiablePresentation> {
        return new Promise(async (resolve, reject) => {
            walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
                walletConnectManager.prepareSigningMethods(didPhysicalConnection);

                let request = new GetCredentialsRequest(query);
                let response: any = await walletConnectManager.sendCustomRequest(request.getPayload());

                if (!response || !response.result || !response.result.presentation) {
                    console.warn("Missing presentation. The operation was maybe cancelled.", response);
                    resolve(null);
                    return;
                }

                let presentationJson = JSON.stringify(response.result.presentation);
                //console.log("Presentation as JSON string:", presentationJson);
                let presentation = VerifiablePresentation.parse(presentationJson);
                resolve(presentation);
            }, () => {
                resolve(null);
            }).catch(e => {
                reject(e);
            });
        });
    }

    static requestCredentials(disclosureRequest: SDKDID.CredentialDisclosureRequest): Promise<VerifiablePresentation> {
        return new Promise((resolve, reject) => {
            walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
                walletConnectManager.prepareSigningMethods(didPhysicalConnection);

                let request = new RequestCredentialsRequest(disclosureRequest);
                let response: any = await walletConnectManager.sendCustomRequest(request.getPayload());

                if (!response || !response.result || !response.result.presentation) {
                    console.warn("Missing presentation. The operation was maybe cancelled.", response);
                    resolve(null);
                    return;
                }

                let presentationJson = JSON.stringify(response.result.presentation);
                let presentation = VerifiablePresentation.parse(presentationJson);
                resolve(presentation);
            }, () => {
                resolve(null);
            }).catch(e => {
                reject(e);
            });
        });
    }

    static async requestCredentialsV2(requestId: string, disclosureRequest: SDKDID.CredentialDisclosureRequest): Promise<void> {
        return new Promise((resolve, reject) => {
          walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
              walletConnectManager.prepareSigningMethods(didPhysicalConnection);

              // Don't wait processRequestCredentials
              void this.processRequestCredentials(requestId, disclosureRequest);
              resolve(null);
          }, () => {
              void this.processCancleIntentResponse(requestId, IntentType.REQUEST_CREDENTIALS);
              resolve(null);
          }).catch(e => {
              reject(e);
          });
      });
    }

    static async processRequestCredentials(requestId: string, disclosureRequest: SDKDID.CredentialDisclosureRequest) {
      let request = new RequestCredentialsRequest(disclosureRequest);

      const intentEntity: IntentEntity = {
        id: requestId,
        type : IntentType.REQUEST_CREDENTIALS,
        requestPayload: {
          caller: getSafeApplicationDID(),
          requestId: requestId
        },
        responsePayload: null
      }

      let response: any = await walletConnectManager.sendCustomRequest(request.getPayload());
      if (!response || !response.result || !response.result.presentation) {
          console.warn("Missing presentation. The operation was maybe cancelled.", response);
      } else {
        intentEntity.responsePayload = response.result.presentation
      }

      processIntentResponse(intentEntity);
    }

    static async processRequestCredentialsResponse(intent: IntentEntity): Promise<VerifiablePresentation> {
        if (!intent.responsePayload) return null;

        const presentation = VerifiablePresentation.parse(intent.responsePayload);
        return presentation;
    }

    static async issueCredential(
        holder: string,
        types: string[],
        subject: JSONObject,
        identifier?: string,
        expirationDate?: string,
    ): Promise<VerifiableCredential> {
        return new Promise((resolve, reject) => {
            walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
                walletConnectManager.prepareSigningMethods(didPhysicalConnection);

                let request = new IssueCredentialRequest(holder, types, subject, identifier, expirationDate);
                let response: any = await walletConnectManager.sendCustomRequest(request.getPayload());

                if (!response || !response.result || !response.result.credential) {
                    console.warn("Missing result data. The operation was maybe cancelled.", response);
                    resolve(null);
                    return;
                }

                let issuedCredentialJson: string = response.result.credential;
                let issuedCredential = VerifiableCredential.parse(issuedCredentialJson);
                console.log("Issued credential:", issuedCredential);
                resolve(issuedCredential);
            }, () => {
                resolve(null);
            }).catch(e => {
                reject(e);
            });
        });
    }

    static importCredentials(credentials: VerifiableCredential[], options?: SDKDID.ImportCredentialOptions): Promise<SDKDID.ImportedCredential[]> {
        return new Promise((resolve, reject) => {
            walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
                walletConnectManager.prepareSigningMethods(didPhysicalConnection);

                let request = new ImportCredentialsRequest(credentials, options);
                let response: any = await walletConnectManager.sendCustomRequest(request.getPayload());

                if (!response || !response.result || !response.result.importedcredentials || !(response.result.importedcredentials instanceof Array)) {
                    console.warn("Missing result data. The operation was maybe cancelled.", response);
                    resolve(null);
                    return;
                }

                let importedCredentials: SDKDID.ImportedCredential[];
                importedCredentials = (response.result.importedcredentials as string[]).map(credentialUrl => {
                    return {
                        id: DIDURL.from(credentialUrl)
                    }
                });
                console.log("Imported credentials:", importedCredentials);
                resolve(importedCredentials);
            }, () => {
                resolve(null);
            }).catch(e => {
                reject(e);
            });
        });
    }

    static async importCredentialsV2(requestId: string, credentials: VerifiableCredential[], options?: SDKDID.ImportCredentialOptions): Promise<void> {
      return new Promise((resolve, reject) => {
        walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
            walletConnectManager.prepareSigningMethods(didPhysicalConnection);

            void this.processImportCredentials(requestId, credentials, options)
            resolve(null);
        }, () => {
            void this.processCancleIntentResponse(requestId, IntentType.IMPORT_CREDENTIALS);
            resolve(null);
        }).catch(e => {
            reject(e);
        });
    });
    }

    static async processImportCredentials(requestId: string, credentials: VerifiableCredential[], options?: SDKDID.ImportCredentialOptions) {
        let request = new ImportCredentialsRequest(credentials, options);
        let response: any = await walletConnectManager.sendCustomRequest(request.getPayload());

        const intentEntity: IntentEntity = {
            id: requestId,
            type : IntentType.IMPORT_CREDENTIALS,
            requestPayload: {
              caller: getSafeApplicationDID(),
              requestId: requestId
            },
            responsePayload: null
        }

        if (!response || !response.result || !response.result.importedcredentials || !(response.result.importedcredentials instanceof Array)) {
            console.warn("Missing result data. The operation was maybe cancelled.", response);
        } else {
            intentEntity.responsePayload = response.result.importedcredentials
        }

        processIntentResponse(intentEntity);
    }

    static async processImportCredentialsResponse(intent: IntentEntity): Promise<ImportedCredential[]> {
        if (!intent.responsePayload) return null;

        let importedCredentials: ImportedCredential[];
        importedCredentials = (intent.responsePayload as string[]).map(credentialUrl => {
            return {
                id: DIDURL.from(credentialUrl)
            }
        });
        return importedCredentials;
    }

    static async deleteCredentials(credentialIds: string[], options?: SDKDID.DeleteCredentialOptions): Promise<string[]> {
        return new Promise((resolve, reject) => {
            walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
                walletConnectManager.prepareSigningMethods(didPhysicalConnection);

                let request = new DeleteCredentialsRequest(credentialIds, options);
                let response: any = await walletConnectManager.sendCustomRequest(request.getPayload());

                if (!response || !response.result || !response.result.deletedcredentialsids || !(response.result.deletedcredentialsids instanceof Array)) {
                    console.warn("Missing result data. The operation was maybe cancelled.", response);
                    resolve(null);
                    return;
                }

                console.log("Deleted credentials IDs:", response.result.deletedcredentialsids);
                resolve(response.result.deletedcredentialsids);
            }, () => {
                resolve(null);
            }).catch(e => {
                reject(e);
            });
        });
    }

    static async signData(data: string, jwtExtra?: any, signatureFieldName?: string): Promise<SDKDID.SignedData> {
        return new Promise((resolve, reject) => {
            walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
                walletConnectManager.prepareSigningMethods(didPhysicalConnection);

                let request = new SignDataRequest(data, jwtExtra, signatureFieldName);
                let response: any = await walletConnectManager.sendCustomRequest(request.getPayload());

                if (!response || !response.result) {
                    console.warn("Missing result data. The operation was maybe cancelled.", response);
                    resolve(null);
                    return;
                }

                let signedData: SDKDID.SignedData = {
                    signingDID: response.result.iss,
                    publicKey: response.result.publickey,
                    signature: response.result[signatureFieldName],
                    jwtResponse: response.responseJWT
                };

                console.log("Signed data:", signedData);
                resolve(signedData);
            }, () => {
                resolve(null);
            }).catch(e => {
                reject(e);
            });
        });
    }

    static async requestPublish(): Promise<string> {
        return new Promise((resolve, reject) => {
            walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
                walletConnectManager.prepareSigningMethods(didPhysicalConnection);

                let request = new RequestPublishRequest();
                let response: any = await walletConnectManager.sendCustomRequest(request.getPayload());

                if (!response || !response.result || !response.result.txid) {
                    console.warn("Missing result data. The operation was maybe cancelled.", response);
                    resolve(null);
                    return;
                }

                console.log("Transaction ID:", response.result.txid);
                resolve(response.result.txid);
            }, () => {
                resolve(null);
            }).catch(e => {
                reject(e);
            });
        });
    }

    static updateHiveVaultAddress(vaultAddress: string, displayName: string): Promise<SDKDID.UpdateHiveVaultAddressStatus> {
        return new Promise((resolve, reject) => {
            walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
                walletConnectManager.prepareSigningMethods(didPhysicalConnection);

                let request = new UpdateHiveVaultAddressRequest(vaultAddress, displayName);
                let response: { result: { status: SDKDID.UpdateHiveVaultAddressStatus } } = await walletConnectManager.sendCustomRequest(request.getPayload());

                if (!response || !response.result || !response.result.status) {
                    console.warn("Missing result data. The operation was maybe cancelled.", response);
                    resolve(null);
                    return;
                }

                console.log("Hive vault change result:", response.result.status);
                resolve(response.result.status);
            }, () => {
                resolve(null);
            }).catch(e => {
                reject(e);
            });
        });
    }

    static importCredentialContext(serviceName: string, contextCredential: VerifiableCredential): Promise<SDKDID.ImportedCredential> {
        return new Promise((resolve, reject) => {
            walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
                walletConnectManager.prepareSigningMethods(didPhysicalConnection);

                let request = new ImportCredentialContextRequest(serviceName, contextCredential);
                let response: any = await walletConnectManager.sendCustomRequest(request.getPayload());

                if (!response || !response.result || !response.result.importedcredential) {
                    console.warn("Missing result data. The operation was maybe cancelled.", response);
                    resolve(null);
                    return;
                }

                let importedCredential: SDKDID.ImportedCredential = {
                    id: DIDURL.from(response.result.importedcredential)
                };
                console.log("Imported credential context:", importedCredential);
                resolve(importedCredential);
            }, () => {
                resolve(null);
            }).catch(e => {
                reject(e);
            });
        });
    }

    static generateAppIDCredential(appInstanceDID: string, appDID: string): Promise<any> {
        console.log("Essentials: app ID Credential generation flow started");

        return new Promise((resolve, reject) => {
            walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
                walletConnectManager.prepareSigningMethods(didPhysicalConnection);

                let request = new AppIDCredentialRequest(appInstanceDID, appDID);
                let response: any = await walletConnectManager.sendCustomRequest(request.getPayload());

                if (!response || !response.result) {
                    console.warn("Missing result data. The operation was maybe cancelled.", response);
                    resolve(null);
                    return;
                }

                let credential = await VerifiableCredential.parse(response.result.credential);

                console.log("App ID credential returned by Essentials:", credential);
                resolve(credential);
            }, () => {
                resolve(null);
            }).catch(e => {
                reject(e);
            });
        });
    }

    static generateHiveBackupCredential?(sourceHiveNodeDID: string, targetHiveNodeDID: string, targetNodeURL: string): Promise<VerifiableCredential> {
        console.log("Essentials: app ID Credential generation flow started");

        return new Promise((resolve, reject) => {
            walletConnectManager.ensureConnectedToEssentials(async (didPhysicalConnection) => {
                walletConnectManager.prepareSigningMethods(didPhysicalConnection);

                let request = new HiveBackupCredentialRequest(sourceHiveNodeDID, targetHiveNodeDID, targetNodeURL);
                let response = <HiveBackupCredentialResponse>await walletConnectManager.sendCustomRequest(request.getPayload());

                if (!response || !response.result || !response.result.credential) {
                    console.warn("Missing result data. The operation was maybe cancelled.", response);
                    resolve(null);
                    return;
                }

                let credential = await VerifiableCredential.parse(response.result.credential);

                console.log("Hive backup credential returned by Essentials:", credential);
                resolve(credential);
            }, () => {
                resolve(null);
            }).catch(e => {
                reject(e);
            });
        });
    }

    static processCancleIntentResponse(requestId: string, type: IntentType) {
      console.log('processCancleIntentResponse type', type)
      const intentEntity: IntentEntity = {
        id: requestId,
        type : type,
        requestPayload: {
          caller: getSafeApplicationDID(),
          requestId: requestId
        },
        responsePayload: null
      }
      processIntentResponse(intentEntity);
    }
}