import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TileLoadRoutingModule } from './tile-load-routing.module';
import { TileLoadComponent } from './tile-load.component';

@NgModule({
  imports: [
    CommonModule,
    TileLoadRoutingModule
  ],
  declarations: [TileLoadComponent],
  exports: [TileLoadComponent]
})
export class TileLoadModule { }
