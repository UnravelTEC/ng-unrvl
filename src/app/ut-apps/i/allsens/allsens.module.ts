import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AllsensRoutingModule } from './allsens-routing.module';
import { AllsensComponent } from './allsens.component';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

@NgModule({
  imports: [
    CommonModule,
    AllsensRoutingModule,
    MatSelectModule,
    MatDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    MatNativeDateModule
  ],
  declarations: [AllsensComponent]
})
export class AllsensModule { }
