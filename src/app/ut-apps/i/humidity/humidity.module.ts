import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HumidityRoutingModule } from './humidity-routing.module';
import { HumidityComponent } from './humidity.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';


@NgModule({
  declarations: [HumidityComponent],
  imports: [
    CommonModule,
    HumidityRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    MatCheckboxModule,
  ]
})
export class HumidityModule { }
