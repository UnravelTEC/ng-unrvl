import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FlickerRoutingModule } from './flicker-routing.module';
import { FlickerComponent } from './flicker.component';

import { UtDygraphInModule } from '../../shared/ut-dygraph-in/ut-dygraph-in.module';


@NgModule({
  imports: [
    CommonModule,
    FlickerRoutingModule,
    UtDygraphInModule
  ],
  declarations: [FlickerComponent]
})
export class FlickerModule { }
