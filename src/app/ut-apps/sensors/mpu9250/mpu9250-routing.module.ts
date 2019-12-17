import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Mpu9250Component } from './mpu9250.component';const routes: Routes = [ { path: '', component: Mpu9250Component }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Mpu9250RoutingModule { }
