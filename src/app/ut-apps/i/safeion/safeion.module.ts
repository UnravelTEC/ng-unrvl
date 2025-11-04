import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SafeionRoutingModule } from './safeion-routing.module';
import { SafeionComponent } from './safeion.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@NgModule({
  imports: [
    CommonModule,
    SafeionRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    MatCheckboxModule,
  ],
  declarations: [SafeionComponent],
})
export class SafeionModule {}
