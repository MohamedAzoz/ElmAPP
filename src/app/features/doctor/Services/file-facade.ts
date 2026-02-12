import { Injectable } from '@angular/core';
import { FilePrivateClient, RatingFileCommand } from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class FileFacade {
  constructor(private fileService: FilePrivateClient) {}

  rateFile(body: RatingFileCommand) {
    return this.fileService.rateFile(body);
  }
}
