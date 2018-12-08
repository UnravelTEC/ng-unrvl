import { Component, OnInit, Input, Output,EventEmitter } from '@angular/core';

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

  @Output()
  triggerChange = new EventEmitter<number>();

  constructor() {}

  ngOnInit() {}

  setCurrent(newCurrent) {
    this.currentAnnotation = newCurrent;
    this.triggerChange.emit(1);
  }

  adjustTime(secondsToAdjust: number) {
    this.currentAnnotation.x += secondsToAdjust * 1000; // x is in ms
  }
  toggleDisplay() {
    this.expanded = ! this.expanded;
  }
  delete() {
    for (let i = 0; i < this.annotationList.length; i++) {
      if(this.annotationList[i]['x'] == this.currentAnnotation['x']) {
        this.annotationList.splice(i,1);
      }
    }

  }
}
