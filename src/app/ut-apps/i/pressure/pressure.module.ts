import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PressureRoutingModule } from './pressure-routing.module';
import { PressureComponent } from './pressure.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    PressureRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    FormsModule
  ],
  declarations: [PressureComponent]
})
export class PressureModule { }
