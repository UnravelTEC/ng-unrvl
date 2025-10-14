import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Nano4EComponent } from './nano4e.component';
const routes: Routes = [{ path: '', component: Nano4EComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Nano4ERoutingModule {}
