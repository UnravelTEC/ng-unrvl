import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CoretempsRoutingModule } from './coretemps-routing.module';
import { CoretempsComponent } from './coretemps.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    CoretempsRoutingModule,
    UtDygraphInModule,
    MatSelectModule,
    FormsModule
  ],
  declarations: [CoretempsComponent]
})
export class CoretempsModule { }
