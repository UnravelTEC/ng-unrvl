import {
  Component,
  OnInit,
  ViewEncapsulation,
  SimpleChanges
} from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';
import { AnnotationsEditorComponent } from './annotations-editor/annotations-editor.component';
import { experimentList } from './experiment-list';

@Component({
  selector: 'app-weihnachtsvorlesung',
  templateUrl: './weihnachtsvorlesung.component.html',
  styleUrls: ['./weihnachtsvorlesung.component.css'],
  encapsulation: ViewEncapsulation.None // from https://coryrylan.com/blog/css-encapsulation-with-angular-components
})
export class WeihnachtsvorlesungComponent implements OnInit {
  // serverHostName: string = 'http://koffer.lan';
  // serverHostName: string = 'http://belinda.cgv.tugraz.at'
  serverHostName = 'scpexploratory02.tugraz.at'; // 'raspigas.lan';
  serverPort = '443';
  serverPath = 'prometheus/api/v1/';
  // queryString: string = 'mic_audiolevel';
  // queryString: string = 'co2{location="FuzzyLab",sensor="scd30"}'
  queryString = 'adc1_c1'; //'adc1_c1';
  dataBaseQueryStepMS = 1000;
  timeRange = 60; // 1 min
  runningAvgSeconds = 0;
  fetchFromServerIntervalMS = 1000;
  dataSeriesNames = ['miclvl'];
  changeTrigger = true;

  calculateRunningAvgFrom: Date = undefined;
  runningAvgToDisplay: number;

  style1 = {
    position: 'absolute',
    top: '3rem',
    bottom: '31vh',
    left: '22em',
    right: '5vw'
  };
  style2 = {
    position: 'absolute',
    top: '70vh',
    bottom: '3vh',
    left: '5vw',
    right: '5vw'
  };

  multiplicateFactors = [100];

  currentExperiment: string; // id: shortText

  // end2 = '2018-12-03 15:00';
  end2 = 'now';
  start2 = '2018-12-10 08:00';
  extraDyGraphConfig2 = {
    dateWindow: [
      new Date('2018-12-10 09:00'), // earliest
      new Date('2018-12-10 12:00') // latest
    ]
    // dyShading (from = Date().getTime()- (.2*60*60*1000), to = Date().getTime()- (1.4*60*60*1000))
  };
  annotations1 = [];
  annotations2 = [];

  constructor(private localStorage: LocalStorageService) {}
  ngOnChanges(changes: SimpleChanges) {
    console.log('app: ngOnC triggered');
  }

  setNewCurrentExperiment(newExperiment: string) {
    this.currentExperiment = newExperiment;
  }

  changeTriggered(invar: number) {
    console.log(invar);
    this.changeTrigger = !this.changeTrigger;
  }
  returnRunningAvg(average: number) {
    this.runningAvgToDisplay = average;
    // console.log(['w.c: got avg: ', average])
  }
  requestRunningAverage(from: Date) {
    console.log('w.c: requestRunningAverage');
    console.log(from);
    this.calculateRunningAvgFrom = from;
  }

  ngOnInit() {
    let lower = true;
    experimentList.forEach(item => {
      lower = !lower;
      let newitem = {
        shortText: item.shortText,
        text: item.text,
        series: 'miclvl',
        cssClass: 'utAnnotation',
        tickColor: 'rgb(148, 231, 255)',
        tickWidth: '2',
        tickHeight: lower ? '30' : '70',
        x: null, // :Date, start date
        clapStart: null, // :Date
        clapStop: null, // :Date
        maxDB: 0 // :Number
      };
      this.annotations1.push(newitem);
      this.annotations2.push(JSON.parse(JSON.stringify(newitem)));
    });

    // manual for test
    // push // Annotations for short term graph
    // this.annotations1[0]['x'] = new Date().getTime();
    // this.annotations1[0]['maxDB'] = 91;
    // this.annotations1[1]['x'] = new Date().getTime() - 1.4 * 60 * 1000;
    // this.annotations1[1]['maxDB'] = 89;

    // Annotations for long term graph
    // this.annotations2[0]['x'] = new Date().getTime();
    // this.annotations2[0]['maxDB'] = 91;
    // this.annotations2[1]['x'] = new Date().getTime() - 1.4 * 60 * 60 * 1000;
    // this.annotations2[1]['maxDB'] = 89;
    // this.annotations2[2]['x'] = new Date().getTime() - 1.2 * 60 * 60 * 1000;
    // this.annotations2[2]['maxDB'] = 77;
    // this.annotations2[3]['x'] = new Date().getTime() - 1 * 60 * 60 * 1000;
    // this.annotations2[3]['maxDB'] = 66;
    // this.annotations2[4]['x'] = new Date().getTime() - 0.7 * 60 * 60 * 1000;
    // this.annotations2[4]['maxDB'] = 55;
    // this.annotations2[5]['x'] = new Date().getTime() - 0.2 * 60 * 60 * 1000;
    // this.annotations2[5]['maxDB'] = 44;
  }
}
