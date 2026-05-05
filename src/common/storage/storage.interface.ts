import type { File as MulterFile } from 'multer';

export interface StorageUploadOptions {
  /**
   * When set, the stored filename becomes `${filenamePrefix}_${uuid}${ext}`
   * instead of the default `${uuid}${ext}`. Useful for tying files to a
   * specific owner (e.g. user id for avatars).
   */
  filenamePrefix?: string;
}

export interface StorageProvider {
  upload(
    file: MulterFile,
    folder: string,
    opts?: StorageUploadOptions,
  ): Promise<string>;
  delete(pathOrKey: string): Promise<void>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
