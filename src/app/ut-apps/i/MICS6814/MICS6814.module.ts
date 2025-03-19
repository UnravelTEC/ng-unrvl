import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MICS6814RoutingModule } from './MICS6814-routing.module';
import { MICS6814Component } from './MICS6814.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';


@NgModule({
  declarations: [MICS6814Component],
  imports: [
    CommonModule,
    UtDygraphInModule,
    MICS6814RoutingModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    MatCheckboxModule,
  ]
})
export class MICS6814Module { }
