import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Ds18b20RoutingModule } from './ds18b20-routing.module';
import { Ds18b20Component } from './ds18b20.component';
import { FormsModule } from '@angular/forms';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    Ds18b20RoutingModule,
    FormsModule,
    UtDygraphModule
  ],
  declarations: [Ds18b20Component]
})
export class Ds18b20Module { }
