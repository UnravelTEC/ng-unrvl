import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-annotations-editor',
  templateUrl: './annotations-editor.component.html',
  styleUrls: ['./annotations-editor.component.css']
})
export class AnnotationsEditorComponent implements OnInit {
  currentAnnotation = {
    series: 'test',
    x: 2,
    shortText: '#1',
    text: 'String'
  };

  @Input()
  annotationList: Array<Object>;

  expanded = true;

  constructor() {}

  ngOnInit() {}

  setCurrent(newCurrent) {
    this.currentAnnotation = newCurrent;
  }

  adjustTime(secondsToAdjust: number) {
    this.currentAnnotation.x += secondsToAdjust * 1000; // x is in ms
  }
}
