import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CoretempsComponent } from './coretemps.component';const routes: Routes = [ { path: '', component: CoretempsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoretempsRoutingModule { }
