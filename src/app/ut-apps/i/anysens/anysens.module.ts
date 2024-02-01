import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnysensRoutingModule } from './anysens-routing.module';
import { AnysensComponent } from './anysens.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';

@NgModule({
  imports: [
    CommonModule,
    AnysensRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    MatCheckboxModule,
  ],
  declarations: [AnysensComponent],
})
export class AnysensModule {}
