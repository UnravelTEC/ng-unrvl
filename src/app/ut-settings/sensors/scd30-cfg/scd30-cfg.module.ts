import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Scd30CfgRoutingModule } from './scd30-cfg-routing.module';
import { Scd30CfgComponent } from './scd30-cfg.component';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
  declarations: [Scd30CfgComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatCheckboxModule,
    Scd30CfgRoutingModule
  ]
})
export class Scd30CfgModule { }
