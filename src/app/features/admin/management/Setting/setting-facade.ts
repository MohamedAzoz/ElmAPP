import { inject, Injectable, signal } from '@angular/core';
import {
  AddSettingsCommand,
  SettingsClient,
  SettingsDto,
  UpdateSettingsCommand,
} from '../../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class SettingFacade {
  private settingClient = inject(SettingsClient);

  public settings = signal<SettingsDto[]>([]);

  public getSetting() {
    return this.settingClient.getAllSettings().subscribe((res) => {
      this.settings.set(res.data || []);
    });
  }

  public updateSetting(command: UpdateSettingsCommand) {
    return this.settingClient.updateSettings(command);
  }

  public createSetting(command: AddSettingsCommand) {
    return this.settingClient.createSetting(command);
  }
}
