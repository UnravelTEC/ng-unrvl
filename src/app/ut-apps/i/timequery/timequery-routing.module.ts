import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TimequeryComponent } from './timequery.component';const routes: Routes = [ { path: '', component: TimequeryComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TimequeryRoutingModule { }
