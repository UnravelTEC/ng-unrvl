import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoudnessComponent } from './loudness.component';
const routes: Routes = [{ path: '', component: LoudnessComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoudnessRoutingModule {}
