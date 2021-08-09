import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalibrationRoutingModule } from './calibration-routing.module';
import { CalibrationComponent } from './calibration.component';


@NgModule({
  declarations: [CalibrationComponent],
  imports: [
    CommonModule,
    CalibrationRoutingModule
  ]
})
export class CalibrationModule { }
