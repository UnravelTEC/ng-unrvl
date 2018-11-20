import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtDygraphComponent } from './ut-dygraph.component';

import { NgDygraphsModule } from 'ng-dygraphs';

@NgModule({
  imports: [
    CommonModule,
    NgDygraphsModule
  ],
  declarations: [UtDygraphComponent],
  exports: [UtDygraphComponent]
})
export class UtDygraphModule { }
