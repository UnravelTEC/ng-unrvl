import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Tgs5141Component } from './tgs5141.component';const routes: Routes = [ { path: '', component: Tgs5141Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Tgs5141RoutingModule { }
