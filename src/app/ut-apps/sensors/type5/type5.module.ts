import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Type5RoutingModule } from './type5-routing.module';
import { Type5Component } from './type5.component';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    Type5RoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [Type5Component]
})
export class Type5Module { }
