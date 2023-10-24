export interface GetFolderStructureRequest {
  storage_folder: string;
  show_hidden: boolean;
}

export interface GetFolderStructureResponse {
  success: boolean;
  error_message: string;
  storage_folder_structure: string;
}
