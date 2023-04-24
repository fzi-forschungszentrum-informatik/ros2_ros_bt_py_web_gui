import { NodeDataWiring } from "../types";


export interface WireNodeDataRequest {
    wirings: NodeDataWiring[];
    ignore_failure: boolean;
}

export interface WireNodeDataResponse {
    success: boolean;
    error_message: string;
}
