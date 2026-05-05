import { Inject, Injectable } from '@nestjs/common';
import type { File as MulterFile } from 'multer';
import { STORAGE_PROVIDER } from './storage.interface';
import type {
  StorageProvider,
  StorageUploadOptions,
} from './storage.interface';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: StorageProvider,
  ) {}

  upload(file: MulterFile, folder = 'uploads', opts?: StorageUploadOptions) {
    return this.provider.upload(file, folder, opts);
  }

  delete(pathOrKey: string) {
    return this.provider.delete(pathOrKey);
  }
}
