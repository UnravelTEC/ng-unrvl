import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { LocalStorageService } from '../../core/local-storage.service';
import { GlobalSettingsService } from '../../core/global-settings.service';
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
    top: '6rem', /*3rem*/
    bottom: '31vh',
    left: '22em',
    right: '5vw'
  };
  style2 = {
    position: 'absolute',
    top: '70vh',
    bottom: '3vh',
    left: '22em',
    right: '5vw'
  };

  multiplicateFactors = [100];

  currentExperiment: string; // id: shortText

  extraDyGraphConfig1 = {
    underlayCallback: this.underlayCallback
  };

  underlayCallback(canvas, area, g) {
    // console.log(['underlayCallback: ',canvas,area,g]);

    // canvas.fillStyle = 'rgba(255, 255, 102, 1.0)';
    canvas.fillStyle = 'rgba(236, 166, 86, 1.0)';

    function highlight_period(x_start, x_end) {
      const canvas_left_x = g.toDomXCoord(x_start);
      const canvas_right_x = g.toDomXCoord(x_end);
      const canvas_width = canvas_right_x - canvas_left_x;
      canvas.fillRect(canvas_left_x, area.y, canvas_width, area.h);
    }

    const min_data_x = g.getValue(0, 0);
    const max_data_x = g.getValue(g.numRows() - 1, 0);

    let localAnnotations = g.annotations();
    for (let i = 0; i < localAnnotations.length; i++) {
      let annotation = localAnnotations[i];
      if (annotation.clapStart && annotation.clapStop) {
        const begin = annotation.clapStart;
        const end = annotation.clapStop;
        highlight_period(begin, end);
      }
    }
  }

  // end2 = '2018-12-03 15:00';
  end2 = 'now';
  start2 = '2018-12-10 21:00';
  extraDyGraphConfig2 = {
    dateWindow: [
      new Date('2018-12-10 21:00'), // earliest
      new Date('2018-12-10 23:00') // latest
    ],
    underlayCallback: this.underlayCallback
    // dyShading (from = Date().getTime()- (.2*60*60*1000), to = Date().getTime()- (1.4*60*60*1000))
  };
  annotations1 = [];
  annotations2 = [];

  constructor(
    private localStorage: LocalStorageService,
    private globalSettings: GlobalSettingsService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    // console.log('app: ngOnC triggered');
  }

  setNewCurrentExperiment(newExperiment: string) {
    this.currentExperiment = newExperiment;
  }

  changeTriggered(invar: number) {
    // console.log(invar);
    this.changeTrigger = !this.changeTrigger;
  }
  returnRunningAvg(average: number) {
    this.runningAvgToDisplay = average;
    // console.log(['w.c: got avg: ', average])
  }
  requestRunningAverage(from: Date) {
    // console.log('w.c: requestRunningAverage');
    // console.log(from);
    this.calculateRunningAvgFrom = from;
  }

  toggleFullScreen() {
    this.globalSettings.emitChange({ fullscreen: undefined });
  }

  ngOnInit() {
    this.toggleFullScreen();

    let lower = 0;
    experimentList.forEach(item => {
      let newitem = {
        shortText: item.shortText,
        text: item.text,
        series: 'miclvl',
        cssClass: 'utAnnotation',
        tickColor: 'black', // 'rgb(148, 231, 255)
        tickWidth: '2',
        tickHeight: String(lower * 15),
        x: null, // :Date, start date
        clapStart: null, // :Date
        clapStop: null, // :Date
        attachAtBottom: true,
        maxDB: 0 // :Number
      };
      lower = lower + 1;
      if (lower == 4) {
        lower = 0;
      }
      console.log('tickheigth, width');
      console.log([newitem.tickHeight, newitem.tickWidth]);
      this.annotations1.push(newitem);
      let newAnno = JSON.parse(JSON.stringify(newitem));
      newAnno.attachAtBottom = false;
      newAnno.tickColor = 'rgb(255, 0, 0)';
      this.annotations2.push(newAnno);
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
