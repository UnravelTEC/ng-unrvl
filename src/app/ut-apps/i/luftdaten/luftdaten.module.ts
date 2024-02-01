import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LuftdatenRoutingModule } from './luftdaten-routing.module';
import { LuftdatenComponent } from './luftdaten.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    LuftdatenRoutingModule,
    FormsModule
  ],
  declarations: [LuftdatenComponent]
})
export class LuftdatenModule { }
