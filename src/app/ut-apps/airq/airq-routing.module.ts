import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AirqComponent } from './airq.component';const routes: Routes = [ { path: '', component: AirqComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AirqRoutingModule { }
