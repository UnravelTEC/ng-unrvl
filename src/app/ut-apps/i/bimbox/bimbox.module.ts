import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BimboxRoutingModule } from './bimbox-routing.module';
import { BimboxComponent } from './bimbox.component';
import { MapModule } from '../../../shared/map/map.module';
import { MatSelectModule } from '@angular/material/select';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    BimboxRoutingModule,
    UtDygraphModule,
    UtDygraphInModule,
    MapModule,
    MatSelectModule,
    MatIconModule,
    FormsModule
  ],
  declarations: [BimboxComponent]
})
export class BimboxModule { }
