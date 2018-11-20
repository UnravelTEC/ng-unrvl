import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IaqRoutingModule } from './iaq-routing.module';
import { IaqComponent } from './iaq.component';

@NgModule({
  imports: [CommonModule, IaqRoutingModule],
  declarations: [IaqComponent]
})
export class IaqModule {}
