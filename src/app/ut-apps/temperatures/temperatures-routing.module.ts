import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TemperaturesComponent } from './temperatures.component';const routes: Routes = [ { path: '', component: TemperaturesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TemperaturesRoutingModule { }
