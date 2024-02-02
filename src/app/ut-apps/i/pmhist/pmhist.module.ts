import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PmhistRoutingModule } from './pmhist-routing.module';
import { PmhistComponent } from './pmhist.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    PmhistRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    NgChartsModule,
  ],
  declarations: [PmhistComponent]
})
export class PmhistModule { }
