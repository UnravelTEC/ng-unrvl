import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HumidityRoutingModule } from './humidity-routing.module';
import { HumidityComponent } from './humidity.component';
import { UtDygraphModule } from 'app/shared/ut-dygraph/ut-dygraph.module';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    HumidityRoutingModule,
    UtDygraphModule,
    MatSelectModule,
    MatIconModule,
    FormsModule
  ],
  declarations: [HumidityComponent]
})
export class HumidityModule { }
