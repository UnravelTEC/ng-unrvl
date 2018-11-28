import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DygraphDevRoutingModule } from './dygraph-dev-routing.module';
import { DygraphDevComponent } from './dygraph-dev.component';

import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    DygraphDevRoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [DygraphDevComponent]
})
export class DygraphDevModule {}
