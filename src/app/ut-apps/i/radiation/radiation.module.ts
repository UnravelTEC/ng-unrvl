import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RadiationRoutingModule } from './radiation-routing.module';
import { RadiationComponent } from './radiation.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    RadiationRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    FormsModule
  ],
  declarations: [RadiationComponent]
})
export class RadiationModule { }
