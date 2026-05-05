import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { File as MulterFile } from 'multer';
import { StorageProvider, StorageUploadOptions } from './storage.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly basePath = process.env.STORAGE_LOCAL_PATH ?? './uploads';

  async upload(
    file: MulterFile,
    folder: string,
    opts?: StorageUploadOptions,
  ): Promise<string> {
    const dir = path.join(this.basePath, folder);
    await fs.mkdir(dir, { recursive: true });
    const ext = path.extname(file.originalname);
    const uuid = randomUUID();
    const filename = opts?.filenamePrefix
      ? `${opts.filenamePrefix}_${uuid}${ext}`
      : `${uuid}${ext}`;
    await fs.writeFile(path.join(dir, filename), file.buffer);
    return `/${folder}/${filename}`;
  }

  async delete(filePath: string): Promise<void> {
    const abs = path.join(this.basePath, filePath);
    await fs.unlink(abs).catch(() => undefined);
  }
}
