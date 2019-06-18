import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SensorsRoutingModule } from './sensors-routing.module';
import { SensorsComponent } from './sensors.component';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    SensorsRoutingModule,
    MatIconModule
  ],
  declarations: [SensorsComponent]
})
export class SensorsModule { }
