import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Ds18b20RoutingModule } from './ds18b20-routing.module';
import { Ds18b20Component } from './ds18b20.component';
import { UtDygraphInModule } from 'app/shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [Ds18b20Component],
  imports: [
    CommonModule,
    Ds18b20RoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
  ]
})
export class Ds18b20Module { }
