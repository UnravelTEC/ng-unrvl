import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PowerComponent } from './power.component';const routes: Routes = [ { path: '', component: PowerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PowerRoutingModule { }
