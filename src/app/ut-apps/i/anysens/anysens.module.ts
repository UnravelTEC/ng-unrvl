import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnysensRoutingModule } from './anysens-routing.module';
import { AnysensComponent } from './anysens.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
  imports: [
    CommonModule,
    AnysensRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule
  ],
  declarations: [AnysensComponent]
})
export class AnysensModule { }
