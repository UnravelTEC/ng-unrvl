import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TileRhComponent } from './tile-rh.component';const routes: Routes = [ { path: '', component: TileRhComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TileRhRoutingModule { }
