import { Module } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { StorageService } from './storage.service';

@Module({
  providers: [
    { provide: STORAGE_PROVIDER, useClass: LocalStorageProvider },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
