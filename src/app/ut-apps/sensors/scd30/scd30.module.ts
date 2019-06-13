import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Scd30RoutingModule } from './scd30-routing.module';
import { Scd30Component } from './scd30.component';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    Scd30RoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [Scd30Component]
})
export class Scd30Module { }
