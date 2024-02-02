import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TimequeryRoutingModule } from './timequery-routing.module';
import { TimequeryComponent } from './timequery.component';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
