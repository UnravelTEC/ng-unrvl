import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MqttRoutingModule } from './mqtt-routing.module';
import { MqttComponent } from './mqtt.component';
import { UtDygraphInModule } from '../../shared/ut-dygraph-in/ut-dygraph-in.module';

@NgModule({
  imports: [
    CommonModule,
    MqttRoutingModule,
    UtDygraphInModule
  ],
  declarations: [MqttComponent]
})
export class MqttModule { }
