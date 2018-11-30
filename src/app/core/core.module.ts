import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { LocalStorageModule } from './localstorage/localstorage.module';

@NgModule({
  imports: [
    CommonModule,
    LocalStorageModule
  ],
  declarations: []
})
export class CoreModule { }
