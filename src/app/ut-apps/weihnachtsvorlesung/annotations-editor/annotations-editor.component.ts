import { Component, EventEmitter, Input, SimpleChanges, OnInit, Output } from '@angular/core';

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
  @Input()
  annotationList2: Array<Object>;

  expanded = true;

  @Output()
  triggerChange = new EventEmitter<number>();
  @Output()
  setNewCurrentExperiment = new EventEmitter<string>(); // id: shortText

  @Output()
  requestRunningAverage = new EventEmitter<Date>()
  @Input()
  getRunningAverage: number;

  edit = {
    x: false,
    clapStart: false,
    clapEnd: false
  };

  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {

  }

  setCurrent(newCurrent) {
    this.currentAnnotation = newCurrent;
    this.triggerChange.emit(1);
  }

  adjustTime(key: string, secondsToAdjust: number) {
    this.currentAnnotation[key] += secondsToAdjust * 1000; // x is in ms

    const index = this.currentAnnotation['shortText'];
    this.annotationList2.forEach(element => {
      if (element['shortText'] == index) {
        element[key] += secondsToAdjust * 1000;
      }
    });
  }
  toggleDisplay() {
    this.expanded = !this.expanded;
  }
  set(which: string) {
    this.currentAnnotation[which] = new Date().valueOf();
    if(which === 'clapStart') {
      this.requestRunningAverage.emit(new Date(this.currentAnnotation[which] - 1000))
    }
    if(which === 'x') {
      this.setNewCurrentExperiment.emit(this.currentAnnotation.shortText)
    }
  }
  show(which:string) {
    this.edit[which] = !this.edit[which];
  }
  delete() {
    for (let i = 0; i < this.annotationList.length; i++) {
      if (this.annotationList[i]['x'] == this.currentAnnotation['x']) {
        this.annotationList.splice(i, 1);
        this.annotationList2.splice(i, 1);
      }
    }
  }
}
