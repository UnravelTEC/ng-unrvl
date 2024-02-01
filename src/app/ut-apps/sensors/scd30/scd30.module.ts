import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Scd30RoutingModule } from './scd30-routing.module';
import { Scd30Component } from './scd30.component';
import { UtDygraphInModule } from 'app/shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [Scd30Component],
  imports: [
    CommonModule,
    Scd30RoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
  ]
})
export class Scd30Module { }
