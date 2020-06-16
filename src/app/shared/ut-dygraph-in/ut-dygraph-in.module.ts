import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtDygraphInComponent } from './ut-dygraph-in.component';
import { dygNrPipe } from './ut-dygraph-number.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule,
    MatRadioModule
  ],
  declarations: [UtDygraphInComponent, dygNrPipe],
  exports: [UtDygraphInComponent]
})
export class UtDygraphInModule {}
