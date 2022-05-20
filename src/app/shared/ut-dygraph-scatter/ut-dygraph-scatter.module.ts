import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtDygraphScatterComponent } from './ut-dygraph-scatter.component';
import { dygNrPipe } from './ut-dygraph-number.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule,
    MatRadioModule
  ],
  declarations: [UtDygraphScatterComponent, dygNrPipe],
  exports: [UtDygraphScatterComponent]
})
export class UtDygraphScatterModule {}
