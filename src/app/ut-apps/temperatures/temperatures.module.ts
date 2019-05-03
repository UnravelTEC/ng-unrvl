import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TemperaturesRoutingModule } from './temperatures-routing.module';
import { TemperaturesComponent } from './temperatures.component';
import { UtDygraphModule } from 'app/shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    TemperaturesRoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [TemperaturesComponent]
})
export class TemperaturesModule { }
