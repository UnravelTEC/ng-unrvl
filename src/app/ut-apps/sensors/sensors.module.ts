import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SensorsRoutingModule } from './sensors-routing.module';
import { SensorsComponent } from './sensors.component';

@NgModule({
  imports: [
    CommonModule,
    SensorsRoutingModule
  ],
  declarations: [SensorsComponent]
})
export class SensorsModule { }
