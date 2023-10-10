import { Interfaces } from "@elastosfoundation/elastos-connectivity-sdk-js";
import { IntentEntity } from "./intent/intent";
import { IntentType } from "./intent/intent-type";
export type ResponseProcessor = (intent: IntentEntity) => Promise<any>;
export declare function registerIntentResponseProcessor(intentType: IntentType, processor: ResponseProcessor): void;
/**
 * Receive a raw response from the API, and call the matching response processor to let it handle/convert
 * the response payload into the data format expected by the connectivity SDK.
 */
export declare function processIntentResponse(intent: IntentEntity): Promise<void>;
export declare const setResponseHandler: (handler: Interfaces.Connectors.ConnectorResponseHandler) => void;
