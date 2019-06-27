import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Sps30RoutingModule } from './sps30-routing.module';
import { Sps30Component } from './sps30.component';
import { UtDygraphModule } from 'app/shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    Sps30RoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [Sps30Component]
})
export class Sps30Module { }
