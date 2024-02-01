import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimequeryRoutingModule } from './timequery-routing.module';
import { TimequeryComponent } from './timequery.component';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';

@NgModule({
  imports: [
    CommonModule,
    TimequeryRoutingModule,
    MatSelectModule,
    MatDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    MatNativeDateModule
  ],
  declarations: [TimequeryComponent]
})
export class TimequeryModule { }
