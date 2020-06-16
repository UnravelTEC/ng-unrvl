import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UtDygraphModule } from '../../../../app/shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

import { Tsl2561RoutingModule } from './tsl2561-routing.module';
import { Tsl2561Component } from './tsl2561.component';

@NgModule({
  imports: [CommonModule, Tsl2561RoutingModule, UtDygraphModule, FormsModule],
  declarations: [Tsl2561Component]
})
export class Tsl2561Module {}
