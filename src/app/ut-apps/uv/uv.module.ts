import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UvRoutingModule } from './uv-routing.module';
import { UvComponent } from './uv.component';
import { FormsModule } from '@angular/forms';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [CommonModule, UvRoutingModule, FormsModule, UtDygraphModule],
  declarations: [UvComponent]
})
export class UvModule {}
