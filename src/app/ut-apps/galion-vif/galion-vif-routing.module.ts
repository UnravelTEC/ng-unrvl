import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GalionVifComponent } from './galion-vif.component';const routes: Routes = [ { path: '', component: GalionVifComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GalionVifRoutingModule { }
