import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Bme280RoutingModule } from './bme280-routing.module';
import { Bme280Component } from './bme280.component';
import { UtDygraphInModule } from 'app/shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [Bme280Component],
  imports: [
    CommonModule,
    Bme280RoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
  ],
})
export class Bme280Module {}
