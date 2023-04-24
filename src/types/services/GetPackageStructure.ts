export interface GetPackageStructureRequest {
    package: string,
    show_hidden: boolean
}

export interface GetPackageStructureResponse {
    success: boolean,
    error_message: string,
    package_structure: string
}