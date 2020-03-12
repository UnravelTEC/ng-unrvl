import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IndoorclimateComponent } from './indoorclimate.component';const routes: Routes = [ { path: '', component: IndoorclimateComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IndoorclimateRoutingModule { }
