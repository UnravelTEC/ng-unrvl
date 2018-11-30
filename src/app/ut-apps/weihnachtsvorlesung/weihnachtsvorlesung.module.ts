import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WeihnachtsvorlesungRoutingModule } from './weihnachtsvorlesung-routing.module';
import { WeihnachtsvorlesungComponent } from './weihnachtsvorlesung.component';

import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';


@NgModule({
  imports: [
    CommonModule,
    WeihnachtsvorlesungRoutingModule,
    UtDygraphModule
  ],
  declarations: [WeihnachtsvorlesungComponent]
})
export class WeihnachtsvorlesungModule { }
