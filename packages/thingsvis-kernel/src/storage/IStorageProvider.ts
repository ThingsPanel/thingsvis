export interface UploadMetadata {
  filename: string;
  contentType: string;
  [key: string]: unknown;
}

export interface IStorageProvider {
  /**
   * Uploads a file buffer and returns the public accessible URL or path.
   */
  upload(file: Buffer, metadata: UploadMetadata): Promise<string>;

  /**
   * Deletes a file by its URL or path identifier.
   */
  delete?(fileUrl: string): Promise<void>;
}
