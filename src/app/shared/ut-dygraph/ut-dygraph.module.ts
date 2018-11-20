import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtDygraphComponent } from './ut-dygraph.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [UtDygraphComponent],
  exports: [UtDygraphComponent]
})
export class UtDygraphModule { }
