import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnnotationsComponent } from './annotations.component';const routes: Routes = [ { path: '', component: AnnotationsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnnotationsRoutingModule { }
