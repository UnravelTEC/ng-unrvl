import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InfluxTestComponent } from './influx-test.component';const routes: Routes = [ { path: '', component: InfluxTestComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InfluxTestRoutingModule { }
