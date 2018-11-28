import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DygraphDevRoutingModule } from './dygraph-dev-routing.module';
import { DygraphDevComponent } from './dygraph-dev.component';

import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    DygraphDevRoutingModule,
    UtDygraphModule
  ],
  declarations: [DygraphDevComponent]
})
export class DygraphDevModule { }
