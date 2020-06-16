import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PmAnalyzerComponent } from './pm-analyzer.component';const routes: Routes = [ { path: '', component: PmAnalyzerComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PmAnalyzerRoutingModule { }
