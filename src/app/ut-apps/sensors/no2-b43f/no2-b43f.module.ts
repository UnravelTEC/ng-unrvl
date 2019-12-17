import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { No2B43fRoutingModule } from './no2-b43f-routing.module';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';
import { No2B43fComponent } from './no2-b43f.component';

@NgModule({
  imports: [
    CommonModule,
    UtDygraphModule,
    No2B43fRoutingModule
  ],
  declarations: [No2B43fComponent]
})
export class No2B43fModule { }
