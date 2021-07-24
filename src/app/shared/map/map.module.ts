import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './map.component'
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
  declarations: [MapComponent],
  imports: [
    LeafletModule,
    MatIconModule,
    CommonModule
  ],
  exports: [MapComponent]
})
export class MapModule { }
