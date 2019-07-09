import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Mpu9250RoutingModule } from './mpu9250-routing.module';
import { Mpu9250Component } from './mpu9250.component';
import { FormsModule } from '@angular/forms';
import { UtDygraphModule } from '../../../shared/ut-dygraph/ut-dygraph.module';
import { UtFetchmetricsModule } from 'app/shared/ut-fetchmetrics/ut-fetchmetrics.module';

@NgModule({
  imports: [
    CommonModule,
    Mpu9250RoutingModule,
    FormsModule,
    UtFetchmetricsModule,
    UtDygraphModule
  ],
  declarations: [Mpu9250Component]
})
export class Mpu9250Module { }
