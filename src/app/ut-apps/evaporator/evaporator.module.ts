import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EvaporatorRoutingModule } from './evaporator-routing.module';
import { EvaporatorComponent } from './evaporator.component';
import { UtDygraphInModule } from '../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    EvaporatorRoutingModule,
    UtDygraphInModule
  ],
  declarations: [EvaporatorComponent]
})
export class EvaporatorModule { }
