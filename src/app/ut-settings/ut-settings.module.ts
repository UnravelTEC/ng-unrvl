import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UtSettingsRoutingModule } from './ut-settings-routing.module';
import { SettingsPanelComponent } from './settings-panel/settings-panel.component';

@NgModule({
  imports: [
    CommonModule,
    UtSettingsRoutingModule,
    FormsModule
  ],
  declarations: [SettingsPanelComponent]
})
export class UtSettingsModule { }
