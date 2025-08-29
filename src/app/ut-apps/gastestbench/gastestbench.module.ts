import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GastestbenchRoutingModule } from './gastestbench-routing.module';
import { GastestbenchComponent } from './gastestbench.component';
import { UtDygraphInModule } from '../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    GastestbenchRoutingModule,
    UtDygraphInModule
  ],
  declarations: [GastestbenchComponent]
})
export class GastestbenchModule { }
