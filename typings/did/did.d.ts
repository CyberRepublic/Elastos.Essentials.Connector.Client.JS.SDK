import { JSONObject, VerifiableCredential, VerifiablePresentation } from "@elastosfoundation/did-js-sdk";
import { DID as SDKDID } from "@elastosfoundation/elastos-connectivity-sdk-js";
import { ImportedCredential } from "@elastosfoundation/elastos-connectivity-sdk-js/typings/did";
import { IntentEntity } from "../intent/intent";
import { IntentType } from "../intent/intent-type";
export declare class DID {
    static registerResponseProcessors(): void;
    static getCredentials(query: any): Promise<VerifiablePresentation>;
    static requestCredentials(disclosureRequest: SDKDID.CredentialDisclosureRequest): Promise<VerifiablePresentation>;
    static requestCredentialsV2(requestId: string, disclosureRequest: SDKDID.CredentialDisclosureRequest): Promise<void>;
    static processRequestCredentials(requestId: string, disclosureRequest: SDKDID.CredentialDisclosureRequest): Promise<void>;
    static processRequestCredentialsResponse(intent: IntentEntity): Promise<VerifiablePresentation>;
    static issueCredential(holder: string, types: string[], subject: JSONObject, identifier?: string, expirationDate?: string): Promise<VerifiableCredential>;
    static importCredentials(credentials: VerifiableCredential[], options?: SDKDID.ImportCredentialOptions): Promise<SDKDID.ImportedCredential[]>;
    static importCredentialsV2(requestId: string, credentials: VerifiableCredential[], options?: SDKDID.ImportCredentialOptions): Promise<void>;
    static processImportCredentials(requestId: string, credentials: VerifiableCredential[], options?: SDKDID.ImportCredentialOptions): Promise<void>;
    static processImportCredentialsResponse(intent: IntentEntity): Promise<ImportedCredential[]>;
    static deleteCredentials(credentialIds: string[], options?: SDKDID.DeleteCredentialOptions): Promise<string[]>;
    static signData(data: string, jwtExtra?: any, signatureFieldName?: string): Promise<SDKDID.SignedData>;
    static requestPublish(): Promise<string>;
    static updateHiveVaultAddress(vaultAddress: string, displayName: string): Promise<SDKDID.UpdateHiveVaultAddressStatus>;
    static importCredentialContext(serviceName: string, contextCredential: VerifiableCredential): Promise<SDKDID.ImportedCredential>;
    static generateAppIDCredential(appInstanceDID: string, appDID: string): Promise<any>;
    static generateHiveBackupCredential?(sourceHiveNodeDID: string, targetHiveNodeDID: string, targetNodeURL: string): Promise<VerifiableCredential>;
    static processCancleIntentResponse(requestId: string, type: IntentType): void;
}
