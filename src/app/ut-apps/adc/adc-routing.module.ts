import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdcComponent } from './adc.component';
const routes: Routes = [{ path: '', component: AdcComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdcRoutingModule {}
