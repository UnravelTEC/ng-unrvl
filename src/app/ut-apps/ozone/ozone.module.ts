import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OzoneRoutingModule } from './ozone-routing.module';
import { OzoneComponent } from './ozone.component';
import { FormsModule } from '@angular/forms';
import { UtDygraphModule } from '../../shared/ut-dygraph/ut-dygraph.module';

@NgModule({
  imports: [
    CommonModule,
    OzoneRoutingModule,
    UtDygraphModule,
    FormsModule
  ],
  declarations: [OzoneComponent]
})
export class OzoneModule { }
