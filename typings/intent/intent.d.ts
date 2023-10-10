import { IntentType } from "./intent-type";
export type IntentEntity = {
    id: string;
    type: IntentType;
    requestPayload: {
        caller: string;
        requestId: string;
    };
    responsePayload: any;
};
