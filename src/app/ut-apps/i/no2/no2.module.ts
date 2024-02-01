import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { No2RoutingModule } from './no2-routing.module';
import { No2Component } from './no2.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [No2Component],
  imports: [
    CommonModule,
    UtDygraphInModule,
    No2RoutingModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
  ]
})
export class No2Module { }
