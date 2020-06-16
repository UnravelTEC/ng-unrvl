import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LuftdatenComponent } from './luftdaten.component';const routes: Routes = [ { path: '', component: LuftdatenComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LuftdatenRoutingModule { }
