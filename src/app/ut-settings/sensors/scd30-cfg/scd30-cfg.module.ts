import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Scd30CfgRoutingModule } from './scd30-cfg-routing.module';
import { Scd30CfgComponent } from './scd30-cfg.component';


@NgModule({
  declarations: [Scd30CfgComponent],
  imports: [
    CommonModule,
    Scd30CfgRoutingModule
  ]
})
export class Scd30CfgModule { }
