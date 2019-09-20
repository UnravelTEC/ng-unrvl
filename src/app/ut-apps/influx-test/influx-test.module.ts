import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InfluxTestRoutingModule } from './influx-test-routing.module';
import { InfluxTestComponent } from './influx-test.component';

import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

import { UtDygraphInModule } from '../../shared/ut-dygraph-in/ut-dygraph-in.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    UtDygraphModule,
    InfluxTestRoutingModule,
    UtDygraphInModule
  ],
  declarations: [InfluxTestComponent]
})
export class InfluxTestModule { }
