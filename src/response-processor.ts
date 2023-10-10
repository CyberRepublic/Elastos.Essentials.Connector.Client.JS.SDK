import { Interfaces } from "@elastosfoundation/elastos-connectivity-sdk-js";
import { IntentEntity } from "./intent/intent";
import { IntentType } from "./intent/intent-type";

export type ResponseProcessor = (intent: IntentEntity) => Promise<any>;

const processors: {
  // Map of IntentType : ResponseProcessor
  [intentType: string]: ResponseProcessor;
} = {};


export function registerIntentResponseProcessor(intentType: IntentType, processor: ResponseProcessor) {
  processors[intentType] = processor;
}

/**
 * Receive a raw response from the API, and call the matching response processor to let it handle/convert
 * the response payload into the data format expected by the connectivity SDK.
 */
export async function processIntentResponse(intent: IntentEntity) {
  const processedResponse = await processors[intent.type]?.(intent);
  responseHandler?.(intent.requestPayload.requestId, processedResponse);
}

let responseHandler: Interfaces.Connectors.ConnectorResponseHandler = null;
export const setResponseHandler = (handler: Interfaces.Connectors.ConnectorResponseHandler) => {
  responseHandler = handler;
}