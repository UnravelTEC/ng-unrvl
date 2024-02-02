import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnvirograzRoutingModule } from './envirograz-routing.module';
import { EnvirograzComponent } from './envirograz.component';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { UtDygraphInModule } from '../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    EnvirograzRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule
  ],
  declarations: [EnvirograzComponent]
})
export class EnvirograzModule { }
