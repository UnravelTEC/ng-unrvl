import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Tcs34725Component } from './tcs34725.component';const routes: Routes = [ { path: '', component: Tcs34725Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Tcs34725RoutingModule { }
