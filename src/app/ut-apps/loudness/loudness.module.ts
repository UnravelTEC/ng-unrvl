import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoudnessRoutingModule } from './loudness-routing.module';
import { LoudnessComponent } from './loudness.component';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    LoudnessRoutingModule,
    UtDygraphModule
  ],
  declarations: [LoudnessComponent]
})
export class LoudnessModule { }
