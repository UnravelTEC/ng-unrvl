import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IesRoutingModule } from './ies-routing.module';
import { IesComponent } from './ies.component';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    IesRoutingModule,
    UtDygraphModule
  ],
  declarations: [IesComponent]
})
export class IesModule { }
