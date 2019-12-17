import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TilePmComponent } from './tile-pm.component';const routes: Routes = [ { path: '', component: TilePmComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TilePmRoutingModule { }
