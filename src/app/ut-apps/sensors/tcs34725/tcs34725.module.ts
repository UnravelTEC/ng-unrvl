import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Tcs34725RoutingModule } from './tcs34725-routing.module';
import { Tcs34725Component } from './tcs34725.component';
import { UtDygraphModule } from '../../../../app/shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    Tcs34725RoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [Tcs34725Component]
})
export class Tcs34725Module { }
