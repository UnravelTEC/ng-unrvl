import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IaqComponent } from './iaq.component';

const routes: Routes = [
  {
    path: '',
    component: IaqComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IaqRoutingModule {}
