import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GalionAlphasenseComponent } from './galion-alphasense.component';const routes: Routes = [ { path: '', component: GalionAlphasenseComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GalionAlphasenseRoutingModule { }
