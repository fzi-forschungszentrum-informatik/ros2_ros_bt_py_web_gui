export interface FixYamlRequest {
  broken_yaml: string;
}

export interface FixYamlResponse {
  success: boolean;
  error_message: string;
  fixed_yaml: string;
}
