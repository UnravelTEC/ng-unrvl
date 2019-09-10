import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MqttComponent } from './mqtt.component';const routes: Routes = [ { path: '', component: MqttComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MqttRoutingModule { }
