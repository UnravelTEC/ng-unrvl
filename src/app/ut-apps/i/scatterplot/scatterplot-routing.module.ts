import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ScatterplotComponent } from './scatterplot.component';const routes: Routes = [ { path: '', component: ScatterplotComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ScatterplotRoutingModule { }
