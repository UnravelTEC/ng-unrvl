import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtDygraphComponent } from './ut-dygraph.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [UtDygraphComponent],
  exports: [UtDygraphComponent]
})
export class UtDygraphModule { }
