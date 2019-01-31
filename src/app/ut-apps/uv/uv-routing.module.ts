import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UvComponent } from './uv.component';const routes: Routes = [ { path: '', component: UvComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UvRoutingModule { }
