import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Nano4EGen2Component } from './nano4egen2.component';const routes: Routes = [ { path: '', component: Nano4EGen2Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Nano4EGen2RoutingModule { }
