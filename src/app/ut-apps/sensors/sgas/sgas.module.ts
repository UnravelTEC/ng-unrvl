import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SgasRoutingModule } from './sgas-routing.module';
import { SgasComponent } from './sgas.component';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    SgasRoutingModule,
    UtDygraphModule
  ],
  declarations: [SgasComponent]
})
export class SgasModule { }
