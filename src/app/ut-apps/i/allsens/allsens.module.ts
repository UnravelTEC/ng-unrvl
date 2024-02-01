import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AllsensRoutingModule } from './allsens-routing.module';
import { AllsensComponent } from './allsens.component';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';

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
