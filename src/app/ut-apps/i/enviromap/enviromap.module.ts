import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnviromapRoutingModule } from './enviromap-routing.module';
import { EnviromapComponent } from './enviromap.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [EnviromapComponent],
  imports: [
    CommonModule,
    EnviromapRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule
  ]
})
export class EnviromapModule { }
