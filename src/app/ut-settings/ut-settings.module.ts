import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { UtSettingsRoutingModule } from './ut-settings-routing.module';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { SettingsPanelComponent } from './settings-panel/settings-panel.component';

import { DisplayBrighnessComponent } from './pieces/display-brightness/display-brightness.component';
import { SystemTimeComponent } from './pieces/system-time/system-time.component';
import { FanSpeedComponent } from './pieces/fan-speed/fan-speed.component';
import { NetworkComponent } from './pieces/network/network.component';
import { InfluxsettingsComponent } from './pieces/influxsettings/influxsettings.component';


@NgModule({
  imports: [
    CommonModule,
    UtSettingsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatSliderModule,
    MatSelectModule,
    MatRadioModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  declarations: [
    SettingsPanelComponent,
    DisplayBrighnessComponent,
    SystemTimeComponent,
    FanSpeedComponent,
    NetworkComponent,
    InfluxsettingsComponent,
  ],
})
export class UtSettingsModule {}
