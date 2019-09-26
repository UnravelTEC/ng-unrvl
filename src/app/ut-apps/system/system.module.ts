import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SystemRoutingModule } from './system-routing.module';
import { SystemComponent } from './system.component';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    SystemRoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [SystemComponent]
})
export class SystemModule { }
