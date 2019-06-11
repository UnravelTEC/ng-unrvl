import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtDygraphComponent } from './ut-dygraph.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule
  ],
  declarations: [UtDygraphComponent],
  exports: [UtDygraphComponent]
})
export class UtDygraphModule {}
