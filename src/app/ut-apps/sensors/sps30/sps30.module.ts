import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Sps30RoutingModule } from './sps30-routing.module';
import { Sps30Component } from './sps30.component';
import { UtDygraphInModule } from 'app/shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [Sps30Component],
  imports: [
    CommonModule,
    Sps30RoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
  ]
})
export class Sps30Module { }
