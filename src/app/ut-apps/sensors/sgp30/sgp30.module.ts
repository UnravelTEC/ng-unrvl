import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Sgp30RoutingModule } from './sgp30-routing.module';
import { Sgp30Component } from './sgp30.component';
import { UtDygraphModule } from 'app/shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    Sgp30RoutingModule,
    UtDygraphModule
  ],
  declarations: [Sgp30Component]
})
export class Sgp30Module { }
