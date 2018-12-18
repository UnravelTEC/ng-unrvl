import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RHTRoutingModule } from './r-ht-routing.module';
import { RHTComponent } from './r-ht.component';
import { FormsModule } from '@angular/forms';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    RHTRoutingModule,
    FormsModule,
    UtDygraphModule
  ],
  declarations: [RHTComponent]
})
export class RHTModule { }
