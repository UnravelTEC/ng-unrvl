import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GastestbenchComponent } from './gastestbench.component';const routes: Routes = [ { path: '', component: GastestbenchComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GastestbenchRoutingModule { }
