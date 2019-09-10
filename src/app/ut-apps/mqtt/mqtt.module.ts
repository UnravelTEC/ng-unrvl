import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MqttRoutingModule } from './mqtt-routing.module';
import { MqttComponent } from './mqtt.component';

@NgModule({
  imports: [
    CommonModule,
    MqttRoutingModule
  ],
  declarations: [MqttComponent]
})
export class MqttModule { }
