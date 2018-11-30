import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WeihnachtsvorlesungRoutingModule } from './weihnachtsvorlesung-routing.module';
import { WeihnachtsvorlesungComponent } from './weihnachtsvorlesung.component';

@NgModule({
  imports: [
    CommonModule,
    WeihnachtsvorlesungRoutingModule
  ],
  declarations: [WeihnachtsvorlesungComponent]
})
export class WeihnachtsvorlesungModule { }
