import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Ds18b20Component } from './ds18b20.component';const routes: Routes = [ { path: '', component: Ds18b20Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Ds18b20RoutingModule { }
