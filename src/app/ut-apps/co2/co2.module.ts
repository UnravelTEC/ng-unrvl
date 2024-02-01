import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Co2RoutingModule } from './co2-routing.module';
import { Co2Component } from './co2.component';
import { UtDygraphInModule } from 'app/shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [Co2Component],
  imports: [
    CommonModule,
    Co2RoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
  ]
})
export class Co2Module { }
