import { Injectable, signal } from '@angular/core';
import { AddOptionCommand, OptionClient, UpdateOptionCommand } from '../../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class OptionFacade {
  constructor(private option: OptionClient) {}
  addOption(option: AddOptionCommand) {
    return this.option.addOption(option);
  }
  updateOption(option: UpdateOptionCommand) {
    return this.option.updateOption(option);
  }
  deleteOption(optionId: number) {
    return this.option.deleteOption(optionId);
  }
}
