import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TileUvComponent } from './tile-uv.component';const routes: Routes = [ { path: '', component: TileUvComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TileUvRoutingModule { }
