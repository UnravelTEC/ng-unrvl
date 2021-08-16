import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalibrationRoutingModule } from './calibration-routing.module';
import { CalibrationComponent } from './calibration.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';


@NgModule({
  declarations: [CalibrationComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule,
    CalibrationRoutingModule
  ]
})
export class CalibrationModule { }
