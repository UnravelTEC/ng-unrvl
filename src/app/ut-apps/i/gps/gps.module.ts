import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GpsRoutingModule } from './gps-routing.module';
import { MapModule } from '../../../shared/map/map.module';
import { GpsComponent } from './gps.component';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [GpsComponent],
  imports: [
    MatIconModule,
    MatSelectModule,
    FormsModule,
    CommonModule,
    MapModule,
    GpsRoutingModule
  ]
})
export class GpsModule { }
