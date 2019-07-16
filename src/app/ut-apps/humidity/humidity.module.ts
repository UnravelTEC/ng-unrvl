import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HumidityRoutingModule } from './humidity-routing.module';
import { HumidityComponent } from './humidity.component';
import { UtDygraphModule } from 'app/shared/ut-dygraph/ut-dygraph.module';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    HumidityRoutingModule,
    UtDygraphModule,
    MatSelectModule,
    FormsModule
  ],
  declarations: [HumidityComponent]
})
export class HumidityModule { }
