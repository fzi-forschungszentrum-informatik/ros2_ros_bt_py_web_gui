export enum GetMessageFieldsType {
  MESSAGE = 0,
  REQUEST = 1,
  RESPONSE = 2,
  GOAL = 3,
  FEEDBACK = 4,
  RESULT = 5,
}

export interface GetMessageFieldsRequest {
  message_type: string;
  service: boolean;
  action: boolean;
  type: GetMessageFieldsType;
}

export interface GetMessageFieldsResponse {
  fields: string;
  field_names: string[];
  success: boolean;
  error_message: string;
}
