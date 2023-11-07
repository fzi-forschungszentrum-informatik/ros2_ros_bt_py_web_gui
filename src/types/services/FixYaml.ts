export type FixYamlRequest = {
  broken_yaml: string
}

export type FixYamlResponse = {
  success: boolean
  error_message: string
  fixed_yaml: string
}
