import { NgModule } from '@angular/core';
import { CommonModule, FormStyle } from '@angular/common';

import { VocRoutingModule } from './voc-routing.module';
import { VocComponent } from './voc.component';
import { FormsModule } from '@angular/forms';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [CommonModule, VocRoutingModule, FormsModule, UtDygraphModule],
  declarations: [VocComponent]
})
export class VocModule {}
