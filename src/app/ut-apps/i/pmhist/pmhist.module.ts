import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PmhistRoutingModule } from './pmhist-routing.module';
import { PmhistComponent } from './pmhist.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { FormsModule } from '@angular/forms';
import { ChartsModule } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    PmhistRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    ChartsModule,
  ],
  declarations: [PmhistComponent]
})
export class PmhistModule { }
