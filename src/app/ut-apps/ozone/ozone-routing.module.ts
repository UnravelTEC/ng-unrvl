import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OzoneComponent } from './ozone.component';const routes: Routes = [ { path: '', component: OzoneComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OzoneRoutingModule { }
