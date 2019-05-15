import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VifRoutingModule } from './vif-routing.module';
import { VifComponent } from './vif.component';
import { UtDygraphModule } from 'app/shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    VifRoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [VifComponent]
})
export class VifModule { }
