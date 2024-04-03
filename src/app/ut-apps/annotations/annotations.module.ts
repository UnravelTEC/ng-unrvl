import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnnotationsRoutingModule } from './annotations-routing.module';
import { AnnotationsComponent } from './annotations.component';

@NgModule({
  declarations: [AnnotationsComponent],
  imports: [
    CommonModule,
    AnnotationsRoutingModule
  ]
})
export class AnnotationsModule { }
