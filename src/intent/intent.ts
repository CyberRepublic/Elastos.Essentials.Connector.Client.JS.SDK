import { IntentType } from "./intent-type";

export type IntentEntity = {
  id: string;
  type: IntentType;
  requestPayload: {
    caller: string;
    requestId: string;
    // Also all other data added by the connectivity sdk, but not relevant for us
  };
  responsePayload: any;
}