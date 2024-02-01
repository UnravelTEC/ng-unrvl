import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Tsl2561RoutingModule } from './tsl2561-routing.module';
import { Tsl2561Component } from './tsl2561.component';
import { UtDygraphInModule } from 'app/shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [Tsl2561Component],
  imports: [
    CommonModule,
    Tsl2561RoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
  ]
})
export class Tsl2561Module { }
