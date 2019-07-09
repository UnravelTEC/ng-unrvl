import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Type5Component } from './type5.component';const routes: Routes = [ { path: '', component: Type5Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Type5RoutingModule { }
