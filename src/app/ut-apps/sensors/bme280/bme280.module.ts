import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Bme280RoutingModule } from './bme280-routing.module';
import { Bme280Component } from './bme280.component';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    UtDygraphModule,
    Bme280RoutingModule,
  ],
  declarations: [Bme280Component]
})
export class Bme280Module { }
