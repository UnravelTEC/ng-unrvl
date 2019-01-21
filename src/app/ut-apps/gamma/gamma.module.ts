import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GammaRoutingModule } from './gamma-routing.module';
import { GammaComponent } from './gamma.component';
import { FormsModule } from '@angular/forms';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    GammaRoutingModule,
    UtDygraphModule
  ],
  declarations: [GammaComponent]
})
export class GammaModule { }
