import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SafeiondComponent } from './safeiond.component';

const routes: Routes = [ { path: '', component: SafeiondComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SafeiondRoutingModule { }
