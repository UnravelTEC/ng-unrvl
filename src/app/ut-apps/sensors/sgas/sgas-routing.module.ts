import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SgasComponent } from './sgas.component';const routes: Routes = [ { path: '', component: SgasComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SgasRoutingModule { }
