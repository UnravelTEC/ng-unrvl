import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EnvirooneRoutingModule } from './enviroone-routing.module';
import { EnvirooneComponent } from './enviroone.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';


@NgModule({
  imports: [
    CommonModule,
    EnvirooneRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    FormsModule
  ],
  declarations: [EnvirooneComponent]
})
export class EnvirooneModule { }
