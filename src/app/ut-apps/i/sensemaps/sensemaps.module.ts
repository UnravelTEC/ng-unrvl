import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SensemapsRoutingModule } from './sensemaps-routing.module';
import { SensemapsComponent } from './sensemaps.component';

@NgModule({
  imports: [
    CommonModule,
    SensemapsRoutingModule
  ],
  declarations: [SensemapsComponent]
})
export class SensemapsModule { }
