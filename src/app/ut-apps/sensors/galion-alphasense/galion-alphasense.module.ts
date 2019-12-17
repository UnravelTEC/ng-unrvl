import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GalionAlphasenseRoutingModule } from './galion-alphasense-routing.module';
import { GalionAlphasenseComponent } from './galion-alphasense.component';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    GalionAlphasenseRoutingModule,
    UtDygraphModule
  ],
  declarations: [GalionAlphasenseComponent]
})
export class GalionAlphasenseModule { }
