import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UtSettingsRoutingModule } from './ut-settings-routing.module';
import { SettingsPanelComponent } from './settings-panel/settings-panel.component';

@NgModule({
  imports: [
    CommonModule,
    UtSettingsRoutingModule
  ],
  declarations: [SettingsPanelComponent]
})
export class UtSettingsModule { }
