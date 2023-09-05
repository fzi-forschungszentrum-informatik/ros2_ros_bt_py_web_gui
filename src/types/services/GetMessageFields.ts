export interface GetMessageFieldsRequest {
  message_type: string;
  service: boolean;
  action: boolean;
}

export interface GetMessageFieldsResponse {
  fields: string;
  field_names: string[];
  success: boolean;
  error_message: string;
}
