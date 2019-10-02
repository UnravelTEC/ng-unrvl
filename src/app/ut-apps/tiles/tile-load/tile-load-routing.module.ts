import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TileLoadComponent } from './tile-load.component';const routes: Routes = [ { path: '', component: TileLoadComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TileLoadRoutingModule { }
