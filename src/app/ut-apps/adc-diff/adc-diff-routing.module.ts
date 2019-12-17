import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdcDiffComponent } from './adc-diff.component';
const routes: Routes = [{ path: '', component: AdcDiffComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdcDiffRoutingModule {}
