import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Nano4ERoutingModule } from './nano4e-routing.module';
import { Nano4EComponent } from './nano4e.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
  imports: [
    CommonModule,
    Nano4ERoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    MatCheckboxModule,
    MatRadioModule
  ],
  declarations: [Nano4EComponent],
})
export class Nano4EModule {}
