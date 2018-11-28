import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DygraphDevRoutingModule } from './dygraph-dev-routing.module';
import { DygraphDevComponent } from './dygraph-dev.component';

@NgModule({
  imports: [
    CommonModule,
    DygraphDevRoutingModule
  ],
  declarations: [DygraphDevComponent]
})
export class DygraphDevModule { }
