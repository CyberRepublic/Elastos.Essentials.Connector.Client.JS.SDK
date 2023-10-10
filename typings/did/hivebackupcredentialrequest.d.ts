import type { ISerializableRequest } from "../iserializablerequest";
export declare class HiveBackupCredentialRequest implements ISerializableRequest {
    private sourceHiveNodeDID;
    private targetHiveNodeDID;
    private targetNodeURL;
    constructor(sourceHiveNodeDID: string, targetHiveNodeDID: string, targetNodeURL: string);
    getPayload(): string;
}
export type HiveBackupCredentialResponse = {
    result: {
        credential?: string;
    };
};
