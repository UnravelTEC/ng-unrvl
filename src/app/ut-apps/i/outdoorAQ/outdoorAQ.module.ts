import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { outdoorAQRoutingModule } from './outdoorAQ-routing.module';
import { outdoorAQComponent } from './outdoorAQ.component';
import { UtDygraphInModule } from '../../../shared/ut-dygraph-in/ut-dygraph-in.module';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';


@NgModule({
  declarations: [outdoorAQComponent],
  imports: [
    CommonModule,
    UtDygraphInModule,
    outdoorAQRoutingModule,
    MatSelectModule,
    MatIconModule,
    FormsModule,
    MatCheckboxModule,
  ]
})
export class outdoorAQModule { }
