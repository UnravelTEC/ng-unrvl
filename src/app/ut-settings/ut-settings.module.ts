import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UtSettingsRoutingModule } from './ut-settings-routing.module';
import { SettingsPanelComponent } from './settings-panel/settings-panel.component';
import { DisplayBrighnessComponent } from './pieces/display-brightness/display-brightness.component';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { SystemTimeComponent } from './pieces/system-time/system-time.component';
import { MatIconModule } from '@angular/material/icon';
import { WifiSettingsComponent } from './pieces/wifi-settings/wifi-settings.component';

@NgModule({
  imports: [
    CommonModule,
    UtSettingsRoutingModule,
    FormsModule,
    MatSliderModule,
    MatSelectModule,
    MatIconModule
  ],
  declarations: [
    SettingsPanelComponent,
    DisplayBrighnessComponent,
    SystemTimeComponent,
    WifiSettingsComponent
  ]
})
export class UtSettingsModule {}
