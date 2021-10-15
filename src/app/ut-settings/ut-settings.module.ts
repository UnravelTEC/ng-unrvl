import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { UtSettingsRoutingModule } from './ut-settings-routing.module';
import { SettingsPanelComponent } from './settings-panel/settings-panel.component';
import { DisplayBrighnessComponent } from './pieces/display-brightness/display-brightness.component';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { SystemTimeComponent } from './pieces/system-time/system-time.component';
import { MatIconModule } from '@angular/material/icon';
import { FanSpeedComponent } from './pieces/fan-speed/fan-speed.component';
import { NetworkComponent } from './pieces/network/network.component';
import { InfluxsettingsComponent } from './pieces/influxsettings/influxsettings.component';
import { Scd30CfgComponent } from './sensors/scd30-cfg/scd30-cfg.component';


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
  ],
  declarations: [
    SettingsPanelComponent,
    DisplayBrighnessComponent,
    SystemTimeComponent,
    FanSpeedComponent,
    NetworkComponent,
    InfluxsettingsComponent,
    Scd30CfgComponent
  ],
})
export class UtSettingsModule {}
