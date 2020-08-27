import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AllsensRoutingModule } from './allsens-routing.module';
import { AllsensComponent } from './allsens.component';

@NgModule({
  imports: [
    CommonModule,
    AllsensRoutingModule
  ],
  declarations: [AllsensComponent]
})
export class AllsensModule { }
