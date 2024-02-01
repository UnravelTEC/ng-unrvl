import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnviromapRoutingModule } from './enviromap-routing.module';
import { EnviromapComponent } from './enviromap.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MapModule } from '../../../shared/map/map.module';


@NgModule({
  declarations: [EnviromapComponent],
  imports: [
    CommonModule,
    EnviromapRoutingModule,
    UtDygraphInModule,
    MapModule,
    MatSelectModule,
    MatIconModule,
    FormsModule
  ]
})
export class EnviromapModule { }
