import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { WeihnachtsvorlesungRoutingModule } from './weihnachtsvorlesung-routing.module';
import { WeihnachtsvorlesungComponent } from './weihnachtsvorlesung.component';

import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';
import { AnnotationsEditorComponent } from './annotations-editor/annotations-editor.component';


@NgModule({
  imports: [
    CommonModule,
    WeihnachtsvorlesungRoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [WeihnachtsvorlesungComponent, AnnotationsEditorComponent]
})
export class WeihnachtsvorlesungModule { }
