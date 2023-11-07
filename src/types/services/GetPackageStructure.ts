export type GetPackageStructureRequest = {
  package: string
  show_hidden: boolean
}

export type GetPackageStructureResponse = {
  success: boolean
  error_message: string
  package_structure: string
}
