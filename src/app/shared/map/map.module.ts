import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './map.component'
import { LeafletModule } from '@asymmetrik/ngx-leaflet';


@NgModule({
  declarations: [MapComponent],
  imports: [
    LeafletModule,
    CommonModule
  ],
  exports: [MapComponent]
})
export class MapModule { }
