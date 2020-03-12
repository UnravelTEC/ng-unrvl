import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnvirograzRoutingModule } from './envirograz-routing.module';
import { EnvirograzComponent } from './envirograz.component';
import { MatSelectModule } from '@angular/material/select';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';
import { UtDygraphInModule } from '../../shared/ut-dygraph-in/ut-dygraph-in.module';

@NgModule({
  imports: [
    CommonModule,
    EnvirograzRoutingModule,
    UtDygraphModule,
    UtDygraphInModule,
    MatSelectModule,
    FormsModule
  ],
  declarations: [EnvirograzComponent]
})
export class EnvirograzModule { }
