import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Sgp30RoutingModule } from './sgp30-routing.module';
import { Sgp30Component } from './sgp30.component';
import { UtDygraphModule } from 'app/shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    Sgp30RoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [Sgp30Component]
})
export class Sgp30Module { }
