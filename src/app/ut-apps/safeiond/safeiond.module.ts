import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SafeiondRoutingModule } from './safeiond-routing.module';
import { SafeiondComponent } from './safeiond.component';
import { UtDygraphInModule } from '../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    SafeiondRoutingModule,
    UtDygraphInModule
  ],
  declarations: [SafeiondComponent]
})
export class SafeiondModule { }
