import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PmRoutingModule } from './pm-routing.module';
import { PmComponent } from './pm.component';

import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    PmRoutingModule,
    UtDygraphModule
  ],
  declarations: [PmComponent]
})
export class PmModule { }
