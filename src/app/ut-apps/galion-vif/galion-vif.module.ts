import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GalionVifRoutingModule } from './galion-vif-routing.module';
import { GalionVifComponent } from './galion-vif.component';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    UtDygraphModule,
    GalionVifRoutingModule
  ],
  declarations: [GalionVifComponent]
})
export class GalionVifModule { }
