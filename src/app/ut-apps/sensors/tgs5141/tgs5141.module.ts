import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Tgs5141RoutingModule } from './tgs5141-routing.module';
import { Tgs5141Component } from './tgs5141.component';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    Tgs5141RoutingModule,
    UtDygraphModule
  ],
  declarations: [Tgs5141Component]
})
export class Tgs5141Module { }
