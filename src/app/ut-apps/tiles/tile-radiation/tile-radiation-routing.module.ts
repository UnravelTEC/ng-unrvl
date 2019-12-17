import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TileRadiationComponent } from './tile-radiation.component';const routes: Routes = [ { path: '', component: TileRadiationComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TileRadiationRoutingModule { }
