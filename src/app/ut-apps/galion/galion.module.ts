import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GalionRoutingModule } from './galion-routing.module';
import { GalionComponent } from './galion.component';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    GalionRoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [GalionComponent]
})
export class GalionModule { }
