import { formatDate } from '@angular/common';
import { FormControl } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';

import Dygraph from 'dygraphs';

import cloneDeep from 'lodash-es/cloneDeep';

import { interval, Subscription } from 'rxjs';
import { HelperFunctionsService } from '../../core/helper-functions.service';
import { LocalStorageService } from '../../core/local-storage.service';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

@Component({
  selector: 'app-ut-dygraph',
  templateUrl: './ut-dygraph.component.html',
  styleUrls: ['./ut-dygraph.component.scss'],
  encapsulation: ViewEncapsulation.None // from https://coryrylan.com/blog/css-encapsulation-with-angular-components
})
export class UtDygraphComponent implements OnInit, OnDestroy {
  // define on start what doesn't change
  @Input()
  // queryString: string;
  queryString = '';

  @Input()
  style = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  };

  @Input()
  YLabel = 'Value (unit)';
  @Input()
  XLabel = undefined;
  @Input()
  dataSeriesLabels: Array<string>;
  @Input()
  endTime = 'now';
  @Input()
  startTime = '15m'; // prefix m for min, s for seconds, h for hours, d for days
  @Input()
  maxRetentionTime = 3; // how long the data is hold in Browser RAM - times the "startTime"
  // - only enforced on fetchnewdata - and only cuts as much as is fetched new.
  public retainDataInfinitely = false;
  public initialDataLength = Infinity; //set on initial Data fetch
  @Input()
  dataBaseQueryStepMS = 1000; // query step on server
  @Input()
  downloadFullResolution = true; // set to false to reduce Database query step to max. of screen res.
  @Input()
  fetchFromServerIntervalMS = this.dataBaseQueryStepMS; // set 0 for no update - but can be changed later - default 1000ms.
  @Input()
  serverHostName: string; // optional, get it from globalSettings instead
  @Input()
  serverPort: string; // optional, get it from globalSettings instead
  @Input()
  serverPath: string; // optional, get it from globalSettings instead
  @Input()
  runningAvgPoints = 0;
  @Input()
  options = true;
  @Input()
  annotations: Array<any>; // would need definition of Dygraphs Annotation
  @Input()
  extraDyGraphConfig: Object;
  @Input()
  minimal = false;
  @Input()
  multiplicateFactors = [1];
  @Input()
  labelBlackList: string[];
  @Input()
  showDate = true;
  @Input()
  backGroundLevels: Array<[number, string]>;

  private backGroundLevelExample = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [400, 'rgba(0, 128, 0, 0.5)'], // green
    [800, 'rgba(255, 255, 0, 0.5)'], // yellow
    [1200, 'rgba(255, 166, 0, 0.5)'], // orange
    [20000, 'rgba(255, 0, 0, 0.5)'] // red
  ];

  @Input()
  calculateRunningAvgFrom: Date;
  @Output()
  returnRunningAvg = new EventEmitter<number>();

  public yRange = [null, null];

  dyGraphOptions = {
    // http://dygraphs.com/options.html
    drawCallback: this.afterDrawCallback,
    zoomCallback: this.afterZoomCallback,
    clickCallback: this.clickCallback,

    // panEdgeFraction: 0.9,

    labels: ['Date'], // one element needed for further code.
    title: '',
    animatedZooms: true,
    connectSeparatedPoints: false,
    logscale: false,
    pointSize: 1, // radius
    hideOverlayOnMouseOut: true,
    highlightSeriesOpts: {
      strokeWidth: 3,
      strokeBorderWidth: 1,
      highlightCircleSize: 5
    },
    labelsSeparateLines: true,
    valueRange: this.yRange,
    legend: <any>'always', // also 'never' possible
    visibility: []
  };
  private minimalOptions = {
    strokeWidth: 1.5,
    logscale: true,
    legend: 'never',
    drawGrid: false,
    drawAxis: false,
    rightGap: 0,
    highlightSeriesBackgroundAlpha: 1,
    highlightCircleSize: 0,
    highlightSeriesOpts: { strokeBorderWidth: 0, strokeWidth: 1.5 }
  };

  public fromZoom: Date;
  public fromFormDate = new FormControl(new Date());
  public toZoom: Date;
  public toFormDate = new FormControl(new Date());

  public displayedData = [];
  public firstDerivation = [];
  public lastValue = undefined;
  public lastValues = [];

  public columnLabels = [];

  public dataBeginTime: Date;
  public dataEndTime: Date;
  public currentXrange: number;
  public currentXrangeText: string;
  public average: number;
  public visibleAverage: number;
  public averages: number[] = [];
  public visibleAverages: number[] = [];
  public stdDev: number;
  public visibleStdDev: number;
  public stdDevs: number[] = [];
  public visibleStdDevs: number[] = [];
  public firstDerivationAvgs: number[] = [];
  public min = Infinity;
  public max = -Infinity;

  public noData = false;
  public runOldData = true;
  public waiting = true;
  public error: string = undefined;

  public running = false;
  public optionsOpen = false;
  public updateOnNewData = true;

  public panAmount = 0.5;
  public zoomValue = 5;
  public zoomMultiplicator = 60;

  public htmlID: string;

  public exportUTC = true;

  private overrideDateWindow = [];
  private requestsUnderway = 0; // don't flood the server if it is not fast enough
  private oldRequestsRunning = 0;
  private lastReset: Date;
  private resetTimeout = 10000; //milliseconds
  public oldFetchRunning = {}; //      {start: Date, end: Date }

  private queryEndPoint: string;

  private maxPointsToFetch = 1000; // 10500; // Prometheus allows 11k max
  public fetchFromServerIntervalReducedMS = this.dataBaseQueryStepMS; //reduced if screen res too low (calculated later)

  public graphWidthPx = 0;
  public maxNativeInterval = 0;

  public stats = false;

  Dygraph: Dygraph;

  intervalSubscription: Subscription;

  constructor(
    private utFetchdataService: UtFetchdataService,
    private localStorage: LocalStorageService,
    private h: HelperFunctionsService
  ) {}

  constructQueryEndpoint(
    server: string = this.serverHostName,
    port: string = this.serverPort,
    path: string = this.serverPath
  ) {
    return this.utFetchdataService.constructPrometheusEndPoint(
      server,
      port,
      path
    );
  }
  getXLabel() {
    const xRangeText = this.currentXrangeText
      ? this.currentXrangeText
      : this.startTime;
    return this.XLabel === undefined
      ? 'Time (' + xRangeText + ')'
      : this.XLabel;
  }
  updateXLabel() {
    this.dyGraphOptions['xlabel'] = this.getXLabel();
    if (this.Dygraph) {
      this.Dygraph.updateOptions({ xlabel: this.dyGraphOptions['xlabel'] });
    }
  }

  ngOnInit() {
    this.dyGraphOptions['underlayCallback'] = this.backGroundLevels
      ? this.highLightBackgroundLevels
      : undefined;
    /*this.dyGraphOptions.labels.push(...this.dataSeriesLabels);
    if (!this.dyGraphOptions.labels[1]) {
      this.dyGraphOptions.labels[1] = this.queryString;
    }*/
    if (this.minimal) {
      this.options = false;
      this.showDate = false;
      this.YLabel = '';
      this.XLabel = '';
      this.maxRetentionTime = 1.2;
    }
    this.dyGraphOptions['ylabel'] = this.YLabel;
    this.updateXLabel();
    this.updateDyGraphOptions();

    if (
      this.dyGraphOptions['dateWindow'] &&
      this.dyGraphOptions['dateWindow'].length
    ) {
      this.overrideDateWindow[0] = this.dyGraphOptions['dateWindow'][0];
      this.overrideDateWindow[1] = this.dyGraphOptions['dateWindow'][1];
    }

    this.htmlID = 'graph_' + (Math.random() + 1).toString();

    console.log(this.startTime, this.endTime);

    [this.dataBeginTime, this.dataEndTime] = this.calculateTimeRange(
      this.startTime,
      this.endTime,
      true
    );

    console.log(
      'dataEndTime ' + (this.dataEndTime.valueOf() / 1000).toString(),
      'range: ',
      (this.dataEndTime.valueOf() - this.dataBeginTime.valueOf()) / 1000,
      's'
    );

    this.queryEndPoint = this.constructQueryEndpoint();
    // console.log('endpoint constructed:', this.queryEndPoint);

    this.utFetchdataService
      .getRange(
        this.queryString,
        this.dataBeginTime,
        this.dataEndTime,
        this.dataBaseQueryStepMS,
        this.queryEndPoint
      )
      .subscribe(
        (displayedData: Object) => this.handleInitialData(displayedData),
        error => this.handlePrometheusErrors(error)
      );
  }

  ngOnDestroy() {
    this.stopUpdate();
    if (this.Dygraph) {
      this.Dygraph.destroy();
      console.log('DyGraph destroyed');
    }
  }

  updateDyGraphOptions() {
    if (this.minimal) {
      for (const key in this.minimalOptions) {
        if (this.minimalOptions.hasOwnProperty(key)) {
          this.dyGraphOptions[key] = this.minimalOptions[key];
        }
      }
    }
    for (const key in this.extraDyGraphConfig) {
      if (this.extraDyGraphConfig.hasOwnProperty(key)) {
        this.dyGraphOptions[key] = this.extraDyGraphConfig[key];
      }
    }
  }

  handlePrometheusErrors(error) {
    console.log(error);
    this.waiting = false;
    if (error['headers']) {
      console.log('headers:');
      console.log(JSON.stringify(error['headers']));
    }
    if (error['message']) {
      console.log(error['message']);
      this.error = error['message'];
    }
    if (error['error']) {
      if (error['error']['target']) {
        console.log(error['error']['target']);
        if (error['error']['target']['__zone_symbol__xhrURL']) {
          this.error +=
            '\n' + error['error']['target']['__zone_symbol__xhrURL'];
        }
      }
      if (error['error']['error']) {
        console.log(
          error['error']['errorType'] + ': ' + error['error']['error']
        );
        if (
          error['error']['error'].search(
            /Try decreasing the query resolution/
          ) > -1
        ) {
          this.error += 'too many points';
          this.stopUpdate();
          return;
        }
      }
    } else {
      this.error = 'unknown error';
    }
  }

  // parse new labels
  // fill resortedPData array -> output
  // update this.columnLabels -> member var
  // add new labels to oldLabels&
  syncNewToOldLabels(promData, oldData, oldLabels) {
    const debugflag = false;
    const receivedDataset = {}; // labelstring : data[] foreach series

    // update labels
    this.debugFun(['old labels:', oldLabels], debugflag);
    const newLabels = [];
    let dataThere = false;
    for (let seriesNr = 0; seriesNr < promData.length; seriesNr++) {
      const series = promData[seriesNr];
      const newLabelString = this.h.createLabelString(
        series['metric'],
        this.labelBlackList
      );
      newLabels.push(newLabelString);

      if (series['values'].length) {
        dataThere = true;
      }
      receivedDataset[newLabelString] = series['values'];
    }
    if (!dataThere) {
      console.log('all data columns received empty');
      return undefined;
    }

    this.debugFun(['new labels:', newLabels], debugflag);

    const resortedPData = []; // in the order of this.displayedData

    resortedPData.push(['Timestamp']); // dummy to have indices the same

    for (let i = 0; i < newLabels.length; i++) {
      const currentNewLabelString = newLabels[i];
      const oldIndex = oldLabels.indexOf(currentNewLabelString);
      if (oldIndex === -1) {
        // update old data with up to now with NaN
        oldData.forEach(element => {
          element.push(NaN);
        });
        resortedPData[oldLabels.length] =
          receivedDataset[currentNewLabelString];
        oldLabels.push(currentNewLabelString);
        this.columnLabels[oldLabels.length - 2] = this.h.getDeep(promData, [
          i,
          'metric'
        ]);
        console.log('columnlabels now:', cloneDeep(this.columnLabels));
        this.debugFun(['added new label, result:', oldLabels], debugflag);
        this.dyGraphOptions.visibility.push(true);
      } else {
        resortedPData[oldIndex] = receivedDataset[currentNewLabelString];
      }
      // Note: it may be the case that resortedPData has empty indices!!
    }
    this.debugFun(['old labels after:', oldLabels], debugflag);
    this.debugFun(['resortedPData:', resortedPData, oldLabels], debugflag); // should be resorted to indices like in oldLabels

    return resortedPData;
  }

  /*
    Prometheus data format:
    {
      data: {
        result: [
          { // series 1
            metric: {
              __name__ : "metricname",
              $keyN: $valueN,
              ...
            },
            values : [
              [
                timestamp0, // number (Seconds since epoch)
                value0 // String
              ],
              [
                timestamp1,
                value1
              ],
              ....
            ]
          },
          { // series 2
            metric: { },
            values: [ [ timestamp, value ], [ t,v ], ... ] // timestamps correspond between series.
          }
        ]
      }
    }
    Dygraphs data format: http://dygraphs.com/data.html
    this.displayedData = [
      [ timestamp0, value01, value02, value03, ...], // timestamp: Date object
      [ timestamp1, value11, value12, value13, ...],
      ...
    ]
    this.dyGraphOptions['labels'] = [
      "Time",
      "labelstring1",
      "labelstring2",
      ...
    ]

    handle any data:
      1. check which columns are there in prometheus data -> concat to a "labelstring"
      1. check which columns are there in this.dyGraphOptions.labels <- this is our index for labelstrings
      -> if missing
        , push to this.dyGraphOptions.labels
        , add NaN to all previous columns of this.displayedData

        there can be holes in any dataset received...

        if receiving several datasets:
          start with "oldest" (has oldest first entry)
              if timestamp < newest we have, delete it
            look with column nr in our labels it is
            receivedDataset = {[]
              labelstring1 : [ ],
              labelstring2 : [ ],
            } =>
            resortedPData [ // in the order of this.displayedData
              "time",
              values0[],
              values1[]
            ]
            create entry [timestamp, undefined, entry, undefined, ...]; array.delete it from source data column


  */

  // newData[], oldLabels[]&, this.displayedData[]&, this.columnLabels[]&,
  //  this.dataBaseQueryStepMS, this.multiplicateFactors[]
  // this.lastValue, this.lastValues
  // funs: this.createLabelString
  updateDataSet(pData: Object, debugflag = false): boolean {
    if (!this.utFetchdataService.checkPrometheusDataValidity(pData)) {
      return;
    }
    // prometheus data
    const result = this.h.getDeep(pData, ['data', 'result']);
    const nrResults = result.length;
    this.debugFun(['updateDataSet: #', nrResults, result], debugflag);

    const dataSet = this.displayedData;
    const oldLabels = this.dyGraphOptions['labels']; // content: another array => call by ref

    const resortedPData = this.syncNewToOldLabels(result, dataSet, oldLabels);

    // go through resortedPData[][], shift firsts...
    let deadManCounter = 0;
    let validRows = 0;
    const nrColumns = oldLabels.length;
    const gap = Number(this.dataBaseQueryStepMS);
    const maxGap = gap * 1.1;
    while (true) {
      this.debugFun(
        ['while', deadManCounter, resortedPData, dataSet],
        debugflag
      );
      deadManCounter++;

      let lastTime: number; // unix time (ms)
      if (
        dataSet.length &&
        dataSet[dataSet.length - 1] &&
        dataSet[dataSet.length - 1][0]
      ) {
        lastTime = dataSet[dataSet.length - 1][0].valueOf();
      } else {
        lastTime = 0;
      }

      this.debugFun(['lastTime:', new Date(lastTime)], debugflag);

      // look up "oldest" timestamp in this row - and take it as base for this row
      let oldestTime = new Date().valueOf();
      let stillWorking = false;
      for (let i = 1; i < nrColumns; i++) {
        // 1 to start not on timestamp column
        const column = resortedPData[i];
        if (!column || column.length === 0) {
          this.debugFun('oldestsearch: column empty', debugflag);
          continue;
        } else {
          stillWorking = true;
        }
        const element = column[0];
        const elementsTime = element[0] * 1000;
        if (elementsTime < oldestTime) {
          oldestTime = elementsTime;
        }
      }
      this.debugFun(['oldestTime', new Date(oldestTime)], debugflag);
      if (deadManCounter > 11000) {
        stillWorking = false;
      }
      if (stillWorking === false) {
        this.debugFun(
          ['updateDataSet: done, added', validRows, 'rows.'],
          debugflag
        );
        break;
      }

      // Gap detection and insertion
      if (lastTime && lastTime + maxGap < oldestTime) {
        const gapRow = [];
        gapRow.push(new Date(lastTime + gap));
        for (let i = 1; i < nrColumns; i++) {
          gapRow.push(NaN);
        }
        this.debugFun(['gapRow:', gapRow], debugflag);
        dataSet.push(gapRow);
      }

      // for every entry in this row that matches the timestamp, take it
      const newRow = [];
      let rowValid = false;
      newRow.push(new Date(oldestTime));
      for (let i = 1; i < nrColumns; i++) {
        const column = resortedPData[i];
        if (!column || !column[0]) {
          newRow[i] = NaN; // not to leave any empty
          continue;
        }

        const elementsTime = column[0][0] * 1000;
        if (elementsTime === oldestTime) {
          // what we want
          const element = column.shift();
          if (this.multiplicateFactors[i - 1]) {
            newRow[i] = Number(element[1]) * this.multiplicateFactors[i - 1];
          } else {
            newRow[i] = Number(element[1]);
          }
          this.updateMinMax(newRow[i]);
          rowValid = true;
          continue;
        }
        if (elementsTime <= lastTime) {
          column.shift(); // we already have it, drop it
          newRow[i] = NaN; // not to leave any empty
          console.error(
            'drop',
            oldLabels[i],
            'on',
            new Date(elementsTime),
            'before',
            new Date(lastTime)
          );
          continue;
        }
        if (elementsTime > oldestTime) {
          this.debugFun(
            [
              'column',
              oldLabels[i],
              'date',
              new Date(elementsTime),
              'behind',
              new Date(oldestTime)
            ],
            debugflag
          );
          newRow[i] = NaN;
        }
      }

      if (rowValid) {
        this.debugFun(['new row ready:', newRow], debugflag);
        if (
          dataSet.length == 0 ||
          newRow[0].valueOf() > dataSet[dataSet.length - 1][0].valueOf() // FIXME this is only to fix a bug upwards (which i did not find) - sometimes a double row would not be filtered out on inserting
        ) {
          dataSet.push(newRow);
          validRows++;
        }
      } else {
        this.debugFun('row invalid', debugflag);
      }
    }

    if (validRows) {
      this.updateLastValueMembers(dataSet);
      if (!this.minimal) {
        const devResults = this.h.calc1stDev(dataSet);
        this.firstDerivation = devResults['devs'];
        this.firstDerivationAvgs = devResults['avgs'];
      }
      this.dataEndTime = dataSet[dataSet.length - 1][0];
    }

    // console.log(cloneDeep(dataSet));

    return true;
  }

  updateLastValueMembers(dataset) {
    if (
      Array.isArray(dataset) &&
      dataset.length &&
      dataset[dataset.length - 1]
    ) {
      const lastrow = dataset[dataset.length - 1];
      // if (this.queryString.startsWith("particulate_matter_ugpm3")) {
      //   console.log("last", lastrow);
      // }

      for (let i = 0; i < lastrow.length; i++) {
        const element = lastrow[i];
        if (element !== undefined && !isNaN(element)) {
          this.lastValues[i] = element;
          // if (this.queryString.startsWith("particulate_matter_ugpm3")) {
          //   console.log(i, lastrow[i]);
          // }
        }
        if (this.lastValues[i] === undefined || isNaN(this.lastValues[i])) {
          for (let row = dataset.length - 1; row >= 0; row--) {
            const lastval = dataset[row][i];
            if (!isNaN(lastval)) {
              this.lastValues[i] = lastval;
              break;
            }
          }
        }
      }
      this.lastValue = NaN;
      let nrValidElements = 0;
      let sum = 0;
      for (let i = 1; i < lastrow.length; i++) {
        const element = lastrow[i];
        if (isNaN(element) || element === undefined || element === null) {
          continue;
        }
        if (element === Infinity || element === -Infinity) {
          return;
        }

        nrValidElements++;
        sum += element;
      }

      if (nrValidElements) {
        this.lastValue = sum / nrValidElements;
      }
    }
  }
  updateMinMax(newdata) {
    if (newdata > this.max) {
      this.max = newdata;
    }
    if (newdata < this.min) {
      this.min = newdata;
    }
  }

  handleInitialData(receivedData: Object) {
    // console.log('handleInitialData: received Data:', cloneDeep(receivedData));

    this.updateDataSet(receivedData);

    this.updateAverages();

    this.updateDateWindow();

    this.waiting = false;
    this.Dygraph = new Dygraph(
      this.htmlID,
      this.displayedData,
      this.dyGraphOptions
    );
    this.Dygraph['parent'] = this;
    if (this.runningAvgPoints) {
      this.Dygraph.adjustRoll(this.runningAvgPoints);
    }
    let usedAnnotations = [];
    if (this.annotations) {
      usedAnnotations = this.annotations;
    } else {
      usedAnnotations = this.localStorage.get(
        'annotations.' + this.dyGraphOptions['labels'][1]
      );
    }

    if (usedAnnotations) {
      const from = this.displayedData[0][0];
      const to = new Date();
      const inViewAnnos = this.filterinViewAnnos(usedAnnotations, from, to);
      this.adjustAnnotationsXtoMS(inViewAnnos);
      this.Dygraph.setAnnotations(inViewAnnos);
    }

    // console.log('handleInitialData: dyoptions', this.dyGraphOptions);
    // console.log('handleInitialData: displayedData', this.displayedData);

    if (this.displayedData.length === 0) {
      console.log('no initial data, do not attempt to update');
      this.noData = true;
      return;
    }
    this.initialDataLength = this.currentXrange;
    console.log('this.initialDataLength', this.initialDataLength);

    if (this.fetchFromServerIntervalMS > 0) {
      this.startUpdate();
    }
    this.yRange = this.Dygraph.yAxisRange();
    // console.log('handleInitialData: calling checkAndFetchOldData');
    this.checkAndFetchOldData();
  }
  handleResettedData(receivedData: Object) {
    console.log('handleResettedData received', cloneDeep(receivedData));

    this.updateDataSet(receivedData);
    this.updateAverages();
    this.updateDateWindow();
    if (this.runningAvgPoints) {
      this.Dygraph.adjustRoll(this.runningAvgPoints);
    }
    this.yRange = this.Dygraph.yAxisRange();
    console.log('handleResettedData: started oldUpdate');
    this.Dygraph.updateOptions({ file: this.displayedData });
    this.checkAndFetchOldData();
  }

  clickCallback(e, x, points) {
    console.log('clickCallback');
    if (this.hasOwnProperty('parent')) {
      const parent = this['parent'];
      if (parent.options != 'false') {
        // do only if user has option to enable it again
        parent.stopUpdateOnNewData();
      }
    }
  }

  afterZoomCallback(
    minDate: number,
    maxDate: number,
    yRanges?: Array<Array<number>>
  ) {
    const debugflag = false;
    if (debugflag) {
      console.log('after dygraph zoom callback');
      console.log(typeof minDate, minDate, maxDate, yRanges);
    }

    if (this.hasOwnProperty('parent')) {
      const parent = this['parent'];
      console.log(yRanges[0]);

      parent.yRange = yRanges[0];
      parent.updateAverages();
      // parent.fromZoom = new Date(minDate);
      // parent.toZoom = new Date(maxDate);

      //reimplementation of parent.updateXLabel();
      parent.setCurrentXrange();
      const xRangeText = parent.currentXrangeText
        ? parent.currentXrangeText
        : parent.startTime;
      parent.dyGraphOptions.xlabel =
        parent.XLabel === undefined
          ? 'Time (' + xRangeText + ')'
          : parent.XLabel;
      // console.log('new xlabel:', parent.dyGraphOptions.xlabel);

      parent.Dygraph.updateOptions(
        { xlabel: parent.dyGraphOptions.xlabel },
        true
      ); //this.upd… gives TS error
    } else {
      console.error('afterZoom: No parent');
    }
  }

  debugFun(logstring: any, enabled = true) {
    if (enabled) {
      const clonetext = cloneDeep(logstring);
      console.log(clonetext);
    }
  }

  afterDrawCallback(g: Dygraph, isOInitial: boolean) {
    const debugflag = false;
    if (debugflag) {
      console.log('after dygraph draw callback');
    }

    if (isOInitial) {
      console.log('ignoring initial afterDrawCallback');
      return;
    }
    if (!g.hasOwnProperty('parent')) {
      console.error('afterDrawCallback: no parent');
      return;
    }
    const parent = g['parent'];
    parent.yRange = g.yAxisRange();

    const xrange = g.xAxisRange();
    const dw = g.getOption('dateWindow');
    const from = xrange[0];
    const to = xrange[1];
    if (debugflag) {
      console.log('xr:', from, to, 'dw:', dw[0], dw[1]);
    }
    if (!from || !to) {
      console.error('after Draw error: from/to NaN');
      // g.resetZoom(); //DONT do, infinite loop!

      if (dw[0] === dw[1]) {
        console.error('dateWindow the same');
      }
      if (debugflag) {
        console.log(dw);
      }
      if (!g.hasOwnProperty('modified')) {
        g['modified'] = 1;
      } else {
        g['modified'] = g['modified'] + 1;
        if (g['modified'] < 10) {
          console.log('afterDraw: redraw with dw');

          g.updateOptions({ dateWindow: dw });
          if (debugflag) {
            console.log('reset dateWindow');
          }
        }
      }

      return;
    }

    if (parent && parent.hasOwnProperty('graphWidthPx')) {
      const area = g.getArea();
      const graphWidthPx = area.w;
      if (parent['graphWidthPx'] !== graphWidthPx) {
        parent['graphWidthPx'] = graphWidthPx;
        console.log('new graph width:', graphWidthPx);

        const from = parent['fromZoom'];
        const to = parent['toZoom'];
        const deltaTimeMS = to.valueOf() - from.valueOf(); // / 1000;

        const neededInterval = 0;

        const maxFetchFrequency = parent['fetchFromServerIntervalMS'];
        const maxDBqueryStep = parent['dataBaseQueryStepMS'];

        const dataPointsInRange = deltaTimeMS / maxDBqueryStep;
        const minDatapointsPerPx = Math.floor(dataPointsInRange / graphWidthPx);

        if (minDatapointsPerPx >= 2) {
          parent['fetchFromServerIntervalReducedMS'] = Math.floor(
            parent['dataBaseQueryStepMS'] * minDatapointsPerPx
          );
        }

        // should affect download of?
        // only historical data
        // fetching new data

        parent['maxNativeInterval'] = minDatapointsPerPx;
        // console.log(parent['graphWidthPx']);
      }
    }

    if (
      parent &&
      parent.hasOwnProperty('fromZoom') &&
      parent.hasOwnProperty('toZoom')
    ) {
      parent.fromZoom = new Date(from);
      parent.toZoom = new Date(to);
      parent.fromFormDate = new FormControl(parent.fromZoom);
      parent.toFormDate = new FormControl(parent.toZoom);

      if (!parent.displayedData || parent.displayedData.length === 0) {
        console.log('afterDrawCallback: no data');
        return;
      }
      const firstDataSet = parent.displayedData[0];

      // const lastDataSet = parent.displayedData[parent.displayedData.length - 1];
      const percentXFirst = g.toPercentXCoord(firstDataSet[0]);
      // const percentXLast = g.toPercentXCoord(lastDataSet[0]);

      parent.updateAverages();

      if (percentXFirst > 0) {
        parent.checkAndFetchOldData();
      }
    }
  }

  checkAndFetchOldData() {
    if (!this.runOldData) {
      console.log('not running, dont checkAndFetchOldData');
      return;
    }

    const from = this.fromZoom.valueOf();

    const missing_ms = this.dataBeginTime.valueOf() - from;

    // console.log(
    //   'checkAndFetchOldData diff [ms]:',
    //   missing_ms,
    //   this.whoami(),
    //   'from',
    //   this.fromZoom,
    //   'dataBegin',
    //   this.dataBeginTime
    // );

    // const earliestDataDate = this.displayedData.length
    //   ? this.displayedData[0][0]
    //   : new Date().valueOf();
    //console.log('from:', from, 'earliest', earliestDataDate);

    if (missing_ms > this.getQueryStep()) {
      this.fetchOldData(this.fromZoom, this.dataBeginTime);
    }
  }

  startUpdate() {
    this.lastReset = undefined;
    // if (1 == 1) return;
    this.intervalSubscription = interval(
      this.fetchFromServerIntervalMS
    ).subscribe(counter => {
      this.fetchNewData();
    });
    this.running = true;
  }
  stopUpdate() {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
    }
    this.running = false;
  }

  startUpdateOnNewData() {
    this.updateOnNewData = true;
  }
  stopUpdateOnNewData() {
    this.updateOnNewData = false;
  }

  updateFromToPickers() {
    if (this.minimal) {
      return;
    }
    this.fromFormDate = new FormControl(this.fromZoom);
    this.toFormDate = new FormControl(this.toZoom);
  }

  calculateAverage(from?: Date, targetArray = this.displayedData) {
    const datalen = targetArray.length;
    if (!datalen) {
      return;
    }
    // console.log('ut-dy.c: calculateAverage');
    // console.log(from);
    let sum = 0,
      upper = 0,
      lower;
    if (from) {
      [lower, upper] = this.h.binarySearchNearDate(targetArray, from);
      console.log([lower, upper]);
      console.log([
        'avg (',
        (targetArray[datalen - 1][0] - targetArray[upper][0]) / 1000,
        ')s from ',
        targetArray[upper][0],
        ' to ',
        targetArray[datalen - 1][0]
      ]);
    }
    const nr_series = targetArray[0].length;
    for (let series_i = 1; series_i <= nr_series - 1; series_i++) {
      sum = 0;
      let series_count = 0;
      for (let time_i = upper; time_i < datalen; time_i++) {
        const value = targetArray[time_i][series_i];
        if (isNaN(value)) {
          // console.log(i, series_i);
          continue;
        }
        sum += value;
        series_count += 1;
      }
      // console.log(sum);

      this.averages[series_i - 1] = sum / series_count;
    }
    sum = 0;
    for (let i = 0; i < this.averages.length; i++) {
      sum += this.averages[i];
    }

    const avg = sum / this.averages.length;
    //    console.log([avg, datalen - upper]);
    return avg;
  }

  updateAverages() {
    // FIXME is very inefficient, as it calculates it new every time - implment sort of running calculation
    const data = this.displayedData;
    const datalen = data.length;
    if (!datalen) {
      console.log('updateAverages: datalen 0');
      return;
    }
    const nr_series = data[0].length;
    const visibleFrom = this.fromZoom ? this.fromZoom.valueOf() : 0;
    const visibleTo = this.toZoom ? this.toZoom.valueOf() : Infinity;

    let sum = 0;
    let stdDevSum = 0;
    let visibleStdDevSum = 0;
    let allValueCount = 0;
    let allVisibleValueCount = 0;
    for (let series_i = 1; series_i <= nr_series - 1; series_i++) {
      sum = 0;
      let visibleSum = 0;
      let series_count = 0;
      let visibleCount = 0;
      for (let time_i = 0; time_i < datalen; time_i++) {
        const value = data[time_i][series_i];
        if (isNaN(value)) {
          // console.log(i, series_i);
          continue;
        }
        sum += value;
        series_count += 1;
        let timestamp = data[time_i][0];
        if (timestamp >= visibleFrom && timestamp <= visibleTo) {
          visibleSum += value;
          visibleCount += 1;
        }
      }
      // console.log(sum);

      let mean = sum / series_count;
      this.averages[series_i - 1] = mean;
      let visibleMean = visibleSum / visibleCount;
      this.visibleAverages[series_i - 1] = visibleMean;

      // and now, the std dev.
      allValueCount += series_count;
      allVisibleValueCount += visibleCount;
      let seriesStdDevSum = 0;
      let visibleSeriesStdDevSum = 0;

      for (let time_i = 0; time_i < datalen; time_i++) {
        const value = data[time_i][series_i];
        if (isNaN(value)) {
          continue;
        }
        let addedValue = Math.pow(value - mean, 2);
        stdDevSum += addedValue;
        seriesStdDevSum += addedValue;
        let timestamp = data[time_i][0];
        if (timestamp >= visibleFrom && timestamp <= visibleTo) {
          visibleStdDevSum += addedValue;
          visibleSeriesStdDevSum += addedValue;
        }
      }
      this.stdDevs[series_i - 1] = Math.sqrt(seriesStdDevSum / series_count);
      this.visibleStdDevs[series_i - 1] = Math.sqrt(
        visibleSeriesStdDevSum / visibleCount
      );
    }
    this.stdDev = Math.sqrt(stdDevSum / allValueCount);
    this.visibleStdDev = Math.sqrt(visibleStdDevSum / allVisibleValueCount);

    sum = 0;
    for (let i = 0; i < this.averages.length; i++) {
      sum += this.averages[i];
    }
    this.average = sum / this.averages.length;

    sum = 0;
    for (let i = 0; i < this.visibleAverages.length; i++) {
      sum += this.visibleAverages[i];
    }
    this.visibleAverage = sum / this.visibleAverages.length;
  }

  handleUpdatedData(displayedData: Object) {
    this.requestsUnderway--;

    if (!this.Dygraph) {
      console.error('Dygraph not there, unsubscribing');
      this.stopUpdate();
      return;
    }

    // const now = new Date();
    if (this.lastReset) {
      // .valueOf() + this.resetTimeout < now.valueOf() ) {
      console.log(
        'last reset less than ',
        this.resetTimeout / 1000,
        's, discarding data'
      );
      return;
    }

    if (!this.utFetchdataService.checkPrometheusDataValidity(displayedData)) {
      return;
    }

    const oldlength = this.displayedData.length;
    this.updateDataSet(displayedData);
    let newlength = this.displayedData.length;
    if (!this.retainDataInfinitely) {
      const maxDataLength = this.initialDataLength * this.maxRetentionTime;
      // console.log('.initialDataLength',this.initialDataLength, 'max:', maxDataLength);

      if (newlength > maxDataLength) {
        const sniplen = this.minimal
          ? newlength - maxDataLength
          : newlength - oldlength;
        // console.log(
        //   'splice: old:',
        //   oldlength,
        //   'new:',
        //   newlength,
        //   'max:',
        //   maxDataLength,
        //   'snip',
        //   sniplen
        // );
        this.displayedData.splice(0, sniplen);
        if (this.dataBeginTime.valueOf() > this.displayedData[0][0].valueOf()) {
          this.dataBeginTime = this.displayedData[0][0];
        }
        newlength = this.displayedData.length;
      }
    }
    if (this.runningAvgPoints != this.Dygraph.rollPeriod()) {
      console.log('adj roll');
      this.Dygraph.adjustRoll(this.runningAvgPoints);
    }

    const percentX = this.Dygraph.toPercentXCoord(
      this.displayedData[newlength - 1][0]
    );
    // console.log('percentX:', percentX);

    if (this.updateOnNewData && percentX < 1 && percentX > 0.9) {
      this.updateDateWindow();
      this.setCurrentXrange();
      this.Dygraph.updateOptions(
        {
          dateWindow: this.dyGraphOptions['dateWindow']
        },
        true
      );
    }

    // console.log(this.annotations)
    let usedAnnotations = [];
    if (this.annotations) {
      usedAnnotations = this.annotations;
    } else {
      usedAnnotations = this.localStorage.get(
        'annotations.' + this.dyGraphOptions['labels'][1]
      );
    }

    if (usedAnnotations) {
      const from = this.displayedData[0][0];
      const to = new Date();
      const inViewAnnos = this.filterinViewAnnos(usedAnnotations, from, to);
      this.adjustAnnotationsXtoMS(inViewAnnos);
      this.Dygraph.setAnnotations(inViewAnnos, true);
    }

    if (this.calculateRunningAvgFrom) {
      const avg = this.calculateAverage(
        this.calculateRunningAvgFrom,
        this.displayedData
      );
      this.returnRunningAvg.emit(avg);
    }

    let update = true;
    // console.log('DFT', this.dataBeginTime);
    // console.log('frZ', this.fromZoom);
    // console.log('DET', this.dataEndTime);
    // console.log('toZ', this.toZoom);

    if (!this.minimal) {
      if (
        this.dataEndTime.valueOf() >= this.toZoom.valueOf() // &&
        // this.dataBeginTime.valueOf() <= this.fromZoom.valueOf()
      ) {
        console.log('dont update');
        update = false;
        this.updateAverages();
      } else {
        //console.log('graph update');
        // afterDrawCallback calls updateAverages
      }
    }
    this.Dygraph.updateOptions({ file: this.displayedData }, !update);
  }

  setCurrentXrange() {
    if (!this.toZoom || !this.fromZoom) {
      this.currentXrange = 0;
      console.log('setCurrentXrange() unsuccessful');
      return 0;
    }
    this.currentXrange =
      (this.toZoom.valueOf() - this.fromZoom.valueOf()) / 1000;
    // console.log('currentXrange', this.currentXrange);
    if (!this.minimal) {
      const currentMS = Math.round((this.currentXrange % 1) * 1000);
      const textMS = currentMS ? String(currentMS) + 'ms' : '';
      const currentSeconds = Math.floor(this.currentXrange);
      const displayedSeconds = currentSeconds % 60;
      const textSeconds = displayedSeconds
        ? String(displayedSeconds) + 's '
        : '';

      const currentMinutes = Math.floor(currentSeconds / 60);
      const displayedMinutes = currentMinutes % 60;
      const textMinutes = displayedMinutes
        ? String(displayedMinutes) + 'm '
        : '';

      const currentHours = Math.floor(currentMinutes / 60);
      const displayedHours = currentHours % 24;
      const textHours = displayedHours ? String(displayedHours) + 'h ' : '';

      const currentDays = Math.floor(currentHours / 24);
      const textDays = currentDays ? String(currentDays) + 'd ' : '';

      this.currentXrangeText = (
        textDays +
        textHours +
        textMinutes +
        textSeconds +
        textMS
      ).trim();
      this.updateXLabel();
    }
    return this.currentXrange;
  }

  // following cases:
  // live pan (updateOnNewData) enabled or not // handled by handleUpdatedData(),
  //    we are only called to update the Date window if this is true!
  // initial call (no currentXrange yet set)
  // this.dyGraphOptions['dateWindowEnd'] // from Weih-VO, kick it
  updateDateWindow() {
    const blankSpaceOnFreshPercentage = 3;

    const dataEndTime =
      this.endTime === 'now' ? new Date() : new Date(this.endTime);

    if (!this.currentXrange) {
      // initial call from handleInitialData
      this.currentXrange = this.h.parseToSeconds(this.startTime);
    }

    const dataBeginTime = new Date(
      dataEndTime.valueOf() - this.currentXrange * 1000
    );

    const displayShift =
      (this.currentXrange * blankSpaceOnFreshPercentage) / 100;
    dataEndTime.setSeconds(dataEndTime.getSeconds() + displayShift);
    dataBeginTime.setSeconds(dataBeginTime.getSeconds() + displayShift);

    this.dyGraphOptions['dateWindow'] = [
      dataBeginTime.valueOf(),
      dataEndTime.valueOf()
    ];
    this.fromZoom = dataBeginTime;
    this.toZoom = dataEndTime;
    if (!this.minimal) {
      this.updateFromToPickers();
      this.checkAndFetchOldData(); // it may be that through moving datewindow after enabling autopan some old data is not there.
    }
  }

  fetchNewData() {
    // console.log(this.requestsUnderway);
    if (this.requestsUnderway > 0) {
      console.log('not sending displayedData request, one on the way already');
      return;
    }
    if (this.requestsUnderway > 2) {
      console.error('5 requests on the way, none returned, check server conn.');
      return;
    }
    this.requestsUnderway++;

    const startDate = this.displayedData.length
      ? this.displayedData[this.displayedData.length - 1][0]
      : undefined;
    if (!startDate) {
      // no data here, maybe has been deleted

      console.log('fetchNewData: no previous data found');
      console.log('------------------------------------');

      this.requestsUnderway--;

      const fromNum = this.fromZoom.valueOf();
      let toNum = this.toZoom.valueOf();

      const rangeS = String((toNum - fromNum) / 1000);
      console.log('range', rangeS, 's');

      [this.dataBeginTime, this.dataEndTime] = this.calculateTimeRange(
        rangeS + 's',
        this.toZoom.toISOString(),
        true
      );
      console.log('refetch from', this.dataBeginTime, 'to', this.dataEndTime);

      this.utFetchdataService
        .getRange(
          this.queryString,
          this.dataBeginTime,
          this.dataEndTime,
          this.dataBaseQueryStepMS,
          this.queryEndPoint
        )
        .subscribe(
          (displayedData: Object) => this.handleResettedData(displayedData),
          error => this.handlePrometheusErrors(error)
        );
      return;
    }

    this.utFetchdataService
      .getRange(
        this.queryString,
        startDate,
        new Date(),
        this.dataBaseQueryStepMS,
        this.queryEndPoint
      )
      .subscribe((displayedData: Object) =>
        this.handleUpdatedData(displayedData)
      );
  }

  resetData() {
    this.lastReset = new Date();
    this.stopUpdate();
    this.stopUpdateOnNewData();
    while (this.displayedData.length) {
      this.displayedData.pop(); // fastest way to clear array
    }
    this.dataBeginTime = this.toZoom;
    this.dataEndTime = this.toZoom;
    this.dyGraphOptions.logscale = false;

    this.Dygraph.updateOptions({
      file: this.displayedData,
      logscale: this.dyGraphOptions.logscale
    });
    console.log('-----------------------------------');
    console.log('.       data Discarded');
    console.log('-----------------------------------');
  }

  getQueryStep() {
    const dataBaseQueryStepMS = this.downloadFullResolution
      ? this.dataBaseQueryStepMS
      : this.fetchFromServerIntervalReducedMS;
    return dataBaseQueryStepMS;
  }

  whoami() {
    if (this.columnLabels) {
      if (this.columnLabels[0]) {
        if (this.columnLabels[0]['__name__']) {
          return this.columnLabels[0]['__name__'];
        } else {
          console.log("whoami: no this.columnLabels[0]['__name__']");
          return this.columnLabels[0];
        }
      } else {
        console.log('whoami: no this.columnLabels[0]');
        return this.columnLabels;
      }
    } else {
      console.log('whoami: no this.columnLabels');
      return this;
    }
  }

  fetchOldData(from: Date, to: Date) {
    console.log('fetchOldData: from', from, 'to', to, this.whoami());

    if (this.oldRequestsRunning) {
      console.log('old request already running, dont');
      return;
    }
    const earliestSet = this.dataBeginTime.valueOf();
    const earliestDataDate =
      this.displayedData.length && this.displayedData[0][0] < earliestSet
        ? this.displayedData[0][0]
        : earliestSet;

    const fromNum = from.valueOf();
    let toNum = to.valueOf();

    if (fromNum > toNum) {
      console.error(
        'fetchOldData: difference wrong',
        from,
        to,
        this.columnLabels
      );
      return;
    }

    const dataBaseQueryStepMS = this.getQueryStep();

    if (toNum >= earliestDataDate) {
      toNum = earliestDataDate - dataBaseQueryStepMS;
    }

    if (fromNum === toNum) {
      console.log('fetchOldData: no difference');
      return;
    }
    if (fromNum > toNum) {
      console.log(
        'fetchOldData: difference too small',
        from,
        to,
        this.columnLabels
      );
      return;
    }

    // correct from date to fetch maximum points allowed
    const difference = toNum - fromNum;
    if (difference / dataBaseQueryStepMS > this.maxPointsToFetch) {
      console.log(
        'more than ' +
          this.maxPointsToFetch +
          ' points requested on refetch old, reducing'
      );
      const maxFromValue = toNum - dataBaseQueryStepMS * this.maxPointsToFetch;
      from = new Date(maxFromValue);
    }
    // request data
    this.oldRequestsRunning++;
    this.dataBeginTime = from;
    this.oldFetchRunning = { start: from, end: to };
    console.log('do fetch old data from', from, 'to', to);
    this.highLightFetchRegion();
    this.utFetchdataService
      .getRange(
        this.queryString,
        from,
        to,
        dataBaseQueryStepMS,
        this.queryEndPoint
      )
      .subscribe((data: Object) => this.handleOldRequestedData(data));
  }

  // handle requested old data
  handleOldRequestedData(oldData) {
    this.oldRequestsRunning--;
    this.oldFetchRunning = {};
    this.unHighLightFetchRegion();
    const now = new Date();
    // if (this.lastReset) {
    //   // .valueOf() + this.resetTimeout < now.valueOf() ) {
    //   console.log(
    //     'last reset less than ',
    //     this.resetTimeout / 1000,
    //     's, discarding data'
    //   );
    //   return;
    // }

    const checkResult = this.utFetchdataService.checkPrometheusDataValidity(
      oldData
    );
    if (!checkResult) {
      if (checkResult === null) {
        this.checkAndFetchOldData();
      }
      return;
    }
    const result = this.h.getDeep(oldData, ['data', 'result']);
    const nrResults = result.length;
    console.log('handleOldData: #', nrResults, cloneDeep(result));

    const dataSet = this.displayedData;
    if (!dataSet.length) {
      console.log('no initial dataset');
      this.updateDataSet(oldData);
      this.Dygraph.updateOptions({ file: this.displayedData });
      this.checkAndFetchOldData();
      return;
    }
    const oldLabels = this.dyGraphOptions['labels'];
    const resortedPData = this.syncNewToOldLabels(result, dataSet, oldLabels);
    const labels = this.dyGraphOptions['labels']; // content: another array => call by ref
    const nrColumns = labels.length;

    const dataBaseQueryStepMS = this.getQueryStep();
    const gap = Number(dataBaseQueryStepMS);
    const maxGap = gap * 1.1;
    let validRows = 0;
    // add row after row
    for (let deadManCounter = 0; deadManCounter < 11000; deadManCounter++) {
      const currentStartTime = dataSet[0][0].valueOf();

      // look up newest time in row
      let newestTime = 0;
      let stillWorking = false;
      for (let c = 1; c < nrColumns; c++) {
        const column = resortedPData[c];
        if (!column || column.length === 0) {
          // console.log('oldestsearch: column empty');
          continue;
        } else {
          stillWorking = true;
        }
        const element = column[column.length - 1];
        const elementsTime = element[0] * 1000;
        if (elementsTime > newestTime) {
          newestTime = elementsTime;
        }
      }
      if (stillWorking === false) {
        console.log('handleOldRequestedData: found', validRows, 'rows.');
        break;
      }

      // Gap detection and insertion
      if (Math.abs(newestTime - currentStartTime) > maxGap) {
        const gapRow = [];
        gapRow.push(new Date(newestTime + gap));
        for (let c = 1; c < nrColumns; c++) {
          gapRow.push(NaN);
        }
        console.log('handleOldRequestedData gapRow:', gapRow);
        dataSet.unshift(gapRow);
      }

      // for every entry in this row that matches the timestamp, take it
      const newRow = [];
      let rowValid = false;
      newRow.push(new Date(newestTime));
      for (let c = 1; c < nrColumns; c++) {
        const column = resortedPData[c];
        if (!column || !column[0]) {
          newRow[c] = NaN; // not to leave any empty
          continue;
        }

        const elementsTime = column[column.length - 1][0] * 1000;
        if (elementsTime === newestTime) {
          const element = column.pop();
          if (this.multiplicateFactors[c - 1]) {
            newRow[c] = Number(element[1]) * this.multiplicateFactors[c - 1];
          } else {
            if (this.multiplicateFactors[0]) {
              newRow[c] = Number(element[1]) * this.multiplicateFactors[0];
            } else {
              newRow[c] = Number(element[1]);
            }
          }
          this.updateMinMax(newRow[c]);
          rowValid = true;
          continue;
        }
        if (elementsTime >= currentStartTime) {
          column.pop(); // we already have it, drop it
          newRow[c] = NaN;
          console.error('drop', labels[c], new Date(elementsTime));
          continue;
        }
        if (elementsTime < newestTime) {
          newRow[c] = NaN;
        }
      }

      if (rowValid) {
        dataSet.unshift(newRow);
        validRows++;
      } else {
        console.error('row invalid');
      }
    }
    if (!validRows) {
      return;
    }
    this.noData = false;

    // todo update running avg

    console.log('inserted', validRows, 'rows of old data');
    this.Dygraph.updateOptions({ file: this.displayedData });

    // if (validRows >= 1000 && validRows < 1005) {
    //  //there seem to be more
    //  this.checkAndFetchOldData();
    // }
    console.log('handleOldRequestedData: calling checkAndFetchOldData');
    this.checkAndFetchOldData();
  }

  highLightBackgroundLevels(canvas, area, g) {
    if (
      !g['parent'] ||
      !Array.isArray(g.parent['backGroundLevels']) ||
      g.parent.backGroundLevels.length < 2
    ) {
      console.log('highLightBackgroundLevels: no parent');
      return;
    }
    function highlight_period(y_start, y_end) {
      const y_min = g.toDomYCoord(y_start);
      const y_max = g.toDomYCoord(y_end);
      const area_h = y_max - y_min;
      // console.log(area.x, y_min, area.w, area_h);
      canvas.fillRect(area.x, y_min, area.w, area_h);
    }

    const backGroundLevels = g.parent.backGroundLevels;

    let last_y = backGroundLevels[0][0];
    for (let i = 1; i < backGroundLevels.length; i++) {
      const level = backGroundLevels[i];
      canvas.fillStyle = level[1];
      // console.log(canvas.fillStyle, last_y, level[0]);

      highlight_period(last_y, level[0]);
      last_y = level[0];
    }
  }

  highLightFetchRegionCallBack(canvas, area, g) {
    if (!g['parent']) {
      console.log('highLightFetchRegionCallBack: no parent');
      return;
    }
    canvas.fillStyle = 'rgba(236, 166, 86, 1.0)';
    function highlight_period(x_start, x_end) {
      const canvas_left_x = g.toDomXCoord(x_start);
      const canvas_right_x = g.toDomXCoord(x_end);
      const canvas_width = canvas_right_x - canvas_left_x;
      canvas.fillRect(canvas_left_x, area.y, canvas_width, area.h);
    }
    const highLightRange = g.parent.oldFetchRunning;
    highlight_period(highLightRange.start, highLightRange.end);
    // console.log('underlayCallback called', highLightRange.start, highLightRange.end);
    if (g.parent['backGroundLevels']) {
      g.parent.highLightBackgroundLevels(canvas, area, g);
    }
  }

  highLightFetchRegion() {
    if (this.Dygraph) {
      this.Dygraph.updateOptions({
        underlayCallback: this.highLightFetchRegionCallBack
      });
    }
  }
  unHighLightFetchRegion() {
    if (this.Dygraph) {
      this.Dygraph.updateOptions({
        underlayCallback: this.backGroundLevels
          ? this.highLightBackgroundLevels
          : undefined
      });
    }
  }

  adjustAnnotationsXtoMS(annotations) {
    annotations.forEach(annotation => {
      if (null === annotation['x'] || true === annotation['adjusted']) {
        return;
      }

      // console.log('old annotation: ' + annotation['x']);
      const [lower, upper] = this.h.binarySearchNearDate(
        this.displayedData,
        annotation['x']
      );
      if (!lower || !upper) {
        console.log(
          'no valid x value for ' + annotation['shortText'] + annotation['text']
        );
        // annotation['adjusted'] = true; // FIXME tmp to not load the cpu too high
        return;
      }
      annotation['x'] = this.displayedData[lower][0].valueOf();
      // console.log('lower: ' + annotation['x']);
      // console.log('upper: ' + this.displayedData[upper][0].valueOf());
      // annotation['adjusted'] = true;
    });
    return annotations;
  }

  filterinViewAnnos(annotations: Array<Object>, from: Date, to: Date) {
    const returnedAnnos = [];
    annotations.forEach(annotation => {
      const annoDateMS = annotation['x'];
      if (!annoDateMS) {
        return;
      }
      if (annoDateMS >= from.valueOf() && annoDateMS <= to.valueOf()) {
        returnedAnnos.push(annotation);
      }
    });
    return returnedAnnos;
  }

  toggleOptions() {
    this.optionsOpen = !this.optionsOpen;
    setTimeout(() => {
      this.Dygraph.resize(undefined, undefined);
    }, 150);
  }
  toggleFetching() {
    if (this.running) {
      this.stopUpdate();
      this.running = false;
    } else {
      this.startUpdate();
      this.running = true;
      this.checkAndFetchOldData();
    }
  }
  toggleHistoryFetching() {
    this.runOldData = !this.runOldData;
    if (this.runOldData) {
      this.checkAndFetchOldData();
    }
  }
  resetAndReload() {
    this.runOldData = true;
    this.resetData();
    this.fetchNewData();
  }

  toggleAutoPan() {
    if (this.updateOnNewData) {
      this.stopUpdateOnNewData();
    } else {
      this.startUpdateOnNewData();
    }
  }
  pan(direction: string) {
    this.stopUpdateOnNewData();
    const dw = this.Dygraph.getOption('dateWindow');
    const currentTimeRangeSeconds = dw[1].valueOf() - dw[0].valueOf();
    const panFor = currentTimeRangeSeconds * this.panAmount;
    console.log([direction, this.panAmount, panFor]);
    if (direction === 'forward') {
      dw[0] = new Date(dw[0].valueOf() + panFor);
      dw[1] = new Date(dw[1].valueOf() + panFor);
    }
    if (direction === 'back') {
      dw[0] = new Date(dw[0].valueOf() - panFor - 1); // offset for avoiding no reloading on auto zoom
      dw[1] = new Date(dw[1].valueOf() - panFor + 1);
      this.checkAndFetchOldData();
    }
    this.retainDataInfinitely = true;
    this.Dygraph.updateOptions({ dateWindow: dw });
  }
  resetZoom() {
    if (this.overrideDateWindow && this.overrideDateWindow.length) {
      this.Dygraph.updateOptions({ dateWindow: this.overrideDateWindow });
      console.log('resetZoom: took dateWindow from override');
      return;
    }
    [this.fromZoom, this.toZoom] = this.calculateTimeRange(
      this.startTime,
      this.endTime
    );

    this.Dygraph.updateOptions({
      dateWindow: [this.fromZoom.valueOf(), this.toZoom.valueOf()]
    });

    this.setCurrentXrange();
    this.updateFromToPickers();

    console.log([
      'resetZoom:',
      this.fromZoom,
      this.toZoom,
      this.startTime,
      this.endTime
    ]);
  }
  fullZoom() {
    this.Dygraph.resetZoom();
    const xRange = this.Dygraph.xAxisRange();
    this.fromZoom = new Date(xRange[0]);
    this.toZoom = new Date(xRange[1]);
    this.setCurrentXrange();
    this.retainDataInfinitely = true;
    this.updateFromToPickers();
  }
  zoom(factor: number) {
    this.stopUpdateOnNewData();
    const fromValue = this.fromZoom.valueOf();
    const toValue = this.toZoom.valueOf();

    const difference = toValue - fromValue;
    const distanceToCenter = difference / 2;
    const center = fromValue + distanceToCenter;

    const newdifference = factor * difference;
    const newDistanceToCenter = newdifference / 2;
    const newFrom = fromValue + (distanceToCenter - newDistanceToCenter) + 1;
    const newTo = toValue - (distanceToCenter - newDistanceToCenter) - 1; // offset for avoiding no reloading on auto zoom

    this.toZoom = new Date(newTo);
    this.fromZoom = new Date(newFrom);
    this.Dygraph.updateOptions({
      dateWindow: [newFrom, newTo]
    });
    if (factor > 1) {
      this.checkAndFetchOldData();
    }
    this.retainDataInfinitely = true;
    this.setCurrentXrange();
    this.updateFromToPickers();
  }
  updateYlogscale() {
    this.Dygraph.updateOptions({
      logscale: this.dyGraphOptions.logscale
    });
  }
  toggleLegend() {
    if (this.dyGraphOptions.legend == 'always') {
      this.dyGraphOptions.legend = 'never';
    } else {
      this.dyGraphOptions.legend = 'always';
    }

    this.Dygraph.updateOptions({
      legend: this.dyGraphOptions.legend
    });
  }

  calculateTimeRange(
    startTime: string,
    endTime: string,
    reducePoints = false
  ): [Date, Date] {
    let startDate: Date;
    let endDate: Date;

    endDate = endTime === 'now' ? new Date() : new Date(Date.parse(endTime));

    const seconds = this.h.parseToSeconds(startTime);

    if (seconds) {
      startDate = new Date(endDate.valueOf() - seconds * 1000);
      // console.log('length of interval displayed (s): ' + seconds.toString());
    } else {
      startDate = new Date(startTime);
    }

    if (reducePoints) {
      const difference = endDate.valueOf() - startDate.valueOf();
      if (difference / this.fetchFromServerIntervalMS > this.maxPointsToFetch) {
        console.log(
          'more than ' + this.maxPointsToFetch + ' points requested, reducing'
        );
        const maxStartDateValue =
          endDate.valueOf() -
          this.fetchFromServerIntervalMS * this.maxPointsToFetch;
        startDate = new Date(maxStartDateValue);
      }
    }

    return [startDate, endDate];
  }

  changeRange(param) {
    console.log(['changeRange', param]);
    let startDate: Date;
    let endDate: Date;

    endDate = this.endTime === 'now' ? new Date() : new Date(this.endTime);

    const seconds = this.zoomValue * this.zoomMultiplicator;
    startDate = new Date(endDate.valueOf() - seconds * 1000);

    this.fromZoom = startDate;
    this.toZoom = endDate;
    this.setCurrentXrange();
    this.updateFromToPickers();
    this.retainDataInfinitely = true;
    this.Dygraph.updateOptions({
      dateWindow: [startDate.valueOf(), endDate.valueOf()]
    });
  }

  exportCSV(data?) {
    const labels = this.dyGraphOptions['labels'];
    if (!data) {
      data = this.h.returnDataRange(
        this.displayedData,
        this.fromZoom,
        this.toZoom
      );
    }
    this.h.exportCSV(data, labels, this.exportUTC);
  }
  getAverage(time = '1m', index = 1) {
    let time_s = this.h.parseToSeconds(time);
    if (!time_s) {
      time_s = 60;
    }
    const item_count = Math.ceil((time_s / this.dataBaseQueryStepMS) * 1000);
    if (item_count < 1) {
      console.log('getAvg: no items to average');
      return;
    }

    const avgdata = this.displayedData.slice(
      this.displayedData.length - item_count
    );
    let sum = 0;
    avgdata.forEach(row => {
      sum += row[index];
    });
    return sum / item_count;
  }
  getAverages(time = '1m') {}

  fromDatePickerChanged($event) {
    const newDate = $event['value'];
    console.log('fromDatePickerChanged:', newDate, newDate.valueOf());

    const toSetDate = new Date(newDate.valueOf());
    toSetDate.setHours(this.fromZoom.getHours());
    toSetDate.setMinutes(this.fromZoom.getMinutes());
    toSetDate.setSeconds(this.fromZoom.getSeconds());
    toSetDate.setMilliseconds(this.fromZoom.getMilliseconds());

    const wasRunning = this.updateOnNewData;
    if (wasRunning) {
      this.stopUpdateOnNewData();
    }
    this.fromZoom = toSetDate;
    this.setCurrentXrange();
    this.Dygraph.updateOptions({
      dateWindow: [this.fromZoom.valueOf(), this.toZoom.valueOf()]
    });
    if (wasRunning) {
      this.startUpdateOnNewData();
    }
    this.retainDataInfinitely = true;
    console.log('fromDatePickerChanged: calling checkAndFetchOldData');
    this.checkAndFetchOldData();
  }
  toDatePickerChanged($event) {
    const newTo = $event['value'];

    const toSetDate = new Date(newTo.valueOf());
    toSetDate.setHours(this.toZoom.getHours());
    toSetDate.setMinutes(this.toZoom.getMinutes());
    toSetDate.setSeconds(this.toZoom.getSeconds());
    toSetDate.setMilliseconds(this.toZoom.getMilliseconds());

    this.toZoom = toSetDate;
    this.stopUpdateOnNewData();
    this.setCurrentXrange();
    this.Dygraph.updateOptions({
      dateWindow: [this.fromZoom.valueOf(), this.toZoom.valueOf()]
    });
    this.retainDataInfinitely = true;
  }
  toggleStats() {
    this.stats = !this.stats;
    setTimeout(() => {
      this.Dygraph.resize(undefined, undefined);
    }, 50);
  }
  updateVisibility() {
    // wait for ng to update variables
    setTimeout(() => {
      console.log('new vis:', this.dyGraphOptions.visibility);

      let everythingHidden = true;
      this.dyGraphOptions.visibility.forEach(series => {
        if (series === true) {
          everythingHidden = false;
        }
      });
      if (everythingHidden) {
        for (let i = 0; i < this.dyGraphOptions.visibility.length; i++) {
          this.dyGraphOptions.visibility[i] = true;
        }
      }
      this.Dygraph.updateOptions({
        visibility: this.dyGraphOptions.visibility
      });
    }, 50);
  }
}
