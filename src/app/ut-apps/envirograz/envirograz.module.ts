import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnvirograzRoutingModule } from './envirograz-routing.module';
import { EnvirograzComponent } from './envirograz.component';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    EnvirograzRoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [EnvirograzComponent]
})
export class EnvirograzModule { }
