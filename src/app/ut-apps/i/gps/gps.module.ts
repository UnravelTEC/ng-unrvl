import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GpsRoutingModule } from './gps-routing.module';
import { MapModule } from '../../../shared/map/map.module';
import { GpsComponent } from './gps.component';


@NgModule({
  declarations: [GpsComponent],
  imports: [
    CommonModule,
    MapModule,
    GpsRoutingModule
  ]
})
export class GpsModule { }
