import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Nano4EGen2RoutingModule } from './nano4egen2-routing.module';
import { Nano4EGen2Component } from './nano4egen2.component';
import { UtDygraphInModule } from '../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatRadioModule,
    MatIconModule,
    Nano4EGen2RoutingModule,
    UtDygraphInModule
  ],
  declarations: [Nano4EGen2Component]
})
export class Nano4EGen2Module { }
