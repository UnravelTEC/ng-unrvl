import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PowerRoutingModule } from './power-routing.module';
import { PowerComponent } from './power.component';

import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [CommonModule, PowerRoutingModule, UtDygraphModule],
  declarations: [PowerComponent]
})
export class PowerModule {}
