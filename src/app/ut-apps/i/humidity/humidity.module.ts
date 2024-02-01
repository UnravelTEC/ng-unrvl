import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HumidityRoutingModule } from './humidity-routing.module';
import { HumidityComponent } from './humidity.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';


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
