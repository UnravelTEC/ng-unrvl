import { FormControl } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
  SimpleChanges,
  OnChanges,
} from '@angular/core';

import Dygraph from 'dygraphs';

import cloneDeep from 'lodash-es/cloneDeep';

import { HelperFunctionsService } from '../../core/helper-functions.service';
import { SensorService } from '../sensor.service';
import { GlobalSettingsService } from 'app/core/global-settings.service';

@Component({
  selector: 'app-ut-dygraph-scatter',
  templateUrl: './ut-dygraph-scatter.component.html',
  styleUrls: ['./ut-dygraph-scatter.component.scss'],
  encapsulation: ViewEncapsulation.None, // from https://coryrylan.com/blog/css-encapsulation-with-angular-components
})
export class UtDygraphScatterComponent implements OnInit, OnDestroy, OnChanges {
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
    right: 0,
  };
  private graphBackGroundColor = '#3F3F3F';
  public yO = '0';
  
  private defaultYlabel = 'Value (unit)';
  @Input()
  YLabel = this.defaultYlabel;
  @Input()
  XLabel = undefined;
  @Input()
  runningAvgPoints = 0;
  @Input()
  options = true;
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
  showLogscaleSwitcher = true;
  @Input()
  backGroundLevels: Array<[number, string]>;
  @Input()
  colors = [];

  private backGroundLevelExample = [
    // the color acts for "everything below $value"
    [0.01, 'white'], // first one not used
    [400, 'rgba(0, 128, 0, 0.5)'], // green
    [800, 'rgba(255, 255, 0, 0.5)'], // yellow
    [1200, 'rgba(255, 166, 0, 0.5)'], // orange
    [20000, 'rgba(255, 0, 0, 0.5)'], // red
  ];

  // uses rawLabels to get sensor type, and calculate deviation
  @Input()
  showDeviation = false;
  @Input()
  rawLabels: Array<any>;
  public roundDigits: Array<number> = [null];

  @Input()
  calibrate = true;

  @Input()
  calculateRunningAvgFrom: Date;
  @Output()
  returnRunningAvg = new EventEmitter<Object>();

  @Input()
  enableHighlightCallback = false;
  @Output()
  returnHighlightedRow = new EventEmitter<number>();

  public yRange = [undefined, undefined];
  public yModes: {
    y1min: string;
    y1max: string;
  } = {
    y1min: 'dyn',
    y1max: 'dyn',
  };
  public yFixedRanges: {
    y1min: number;
    y1max: number;
  } = {
    y1min: null,
    y1max: null,
  };
  public yRSelShown = {
    y1min: false,
    y1max: false,
  };
  public xRange = [undefined, undefined];

  private gridlineActiveWidth = 1.5;
  private gridlineInactiveWidth = 0.0001;
  private gridlineActiveColor = '#4A4A4A';
  private gridlineInactiveColor = this.graphBackGroundColor;

  dyGraphOptions = {
    // http://dygraphs.com/options.html
    drawCallback: this.afterDrawCallback,
    // zoomCallback: this.afterZoomCallback,
    clickCallback: this.clickCallback,

    // panEdgeFraction: 0.9,

    labels: [], // one element needed for further code.
    title: '',
    animatedZooms: true,
    connectSeparatedPoints: false,
    highlightSeriesBackgroundAlpha: 1, // disable
    pointSize: 3, // radius
    strokeWidth: 0.0,
    drawPoints: true,
    hideOverlayOnMouseOut: true,
    highlightSeriesOpts: {
      highlightCircleSize: 5,
      strokeBorderColor: this.graphBackGroundColor,
    },
    labelsSeparateLines: true,

    gridLinePattern: [4, 4],
    gridLineWidth: this.gridlineActiveWidth,
    gridLineColor: this.gridlineActiveColor,
    axisLineColor: 'yellow',
    axisLineWidth: 0.001,
    labelsKMB: true,
    xAxisHeight: 34, // xlabel is 18 high
    // yRangePad: 200, // spacing for data points inside graph
    logscale: true, // must be true, otherwise we cant enable it for y/y2
    axes: {
      y: {
        logscale: false,
        drawGrid: true,
        gridLineWidth: this.gridlineActiveWidth,
        independentTicks: true,
      },
    },

    // valueRange: this.yRange,
    legend: <any>'always', // also 'never' possible
    visibility: [],
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
    highlightSeriesOpts: { strokeBorderWidth: 0, strokeWidth: 1.5 },
  };

  @Input()
  public data = [];
  public calibratedData = []; // calculated from data if calibrate is set
  public dataWithDev = []; // calculated from data if showDeviation is set
  public dataWithCalDev = [];
  public displayedData = []; // either set to one of the above

  @Input()
  public dataReset = false;
  public lastValue = undefined;
  public lastValues = [];

  @Input()
  public columnLabels = [];
  @Input()
  public changeTrigger = true;

  public currentXrange: number;

  public min = Infinity;
  public max = -Infinity;

  public noData = false;
  public waiting = true;
  public error: string = undefined;

  public optionsOpen = false;
  public legendContentVisible = true;

  public zoomValue = 5;
  public zoomMultiplicator = 60;

  public htmlID: string;

  public exportUTC = true;

  private overrideDateWindow = [];

  public graphWidthPx = 0;
  @Output()
  returnGraphWidthOnChange = new EventEmitter<number>();
  @Output()
  returnCurrentZoom = new EventEmitter<number>();

  public stats = false;

  Dygraph: Dygraph;

  constructor(
    private h: HelperFunctionsService,
    private sensorService: SensorService,
    public gss: GlobalSettingsService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    console.log('onChanges');

    this.updateGraph();
  }
  onWheel(ev) {
    console.log(ev);
    if (ev.deltaY != 0) {
      this.zoom(ev.deltaY > 0 ? 1.25 : 0.66);
    }

    // if (ev.deltaX != 0) {
    //   const oldPan = this.panAmount;
    //   this.panAmount = 0.05;
    //   this.pan(ev.deltaX > 0 ? 'forward' : 'back');
    //   this.panAmount = oldPan;
    // }
  }

  // getXLabel() {
  //   const xRangeText = '??';
  //   // : this.startTime;
  //   return this.XLabel === undefined
  //     ? 'Time (&#8202;' + xRangeText + '&#8202;)'
  //     : this.XLabel;
  // }
  // returnXrangeText(newXrange) {
  //   return (
  //     '<b>Time</b> (&#8202;' + this.h.createHRTimeString(newXrange) + '&#8202;)'
  //   );
  // }
  // updateXLabel(update = true) {
  //   this.dyGraphOptions['xlabel'] = this.getXLabel();
  //   if (this.Dygraph) {
  //     this.Dygraph.updateOptions(
  //       { xlabel: this.dyGraphOptions['xlabel'] },
  //       !update
  //     );
  //   }
  // }
  updateRoundDigits() {
    if (this.rawLabels) {
      this.roundDigits = [null];
      for (let c = 1; c < this.rawLabels.length; c++) {
        this.roundDigits.push(this.sensorService.getDigits(this.rawLabels[c]));
      }
    }
    console.log('roundDigits:', this.roundDigits);
  }
  updateGraph() {
    if (!this.Dygraph) {
      console.error('updateGraph: no Dygraph?');
      // this.handleInitialData();
      return;
    }

    while (
      this.dyGraphOptions.visibility.length <
      this.columnLabels.length - 1
    ) {
      this.dyGraphOptions.visibility.push(true);
    }

    this.dyGraphOptions['labels'] = this.columnLabels;

    if (!this.data.length) {
      console.log('Dyg reset to no Data');
      this.noData = true;
      this.dataReset = true;
      this.displayedData = [];
      this.dataWithDev = [];
      this.Dygraph.updateOptions({
        file: [],
        labels: [],
      });
      return;
    }
    this.noData = false;
    const newDataBeginTime = this.data[0][0];
    const newDataEndTime = this.data[this.data.length - 1][0];
    // if (!this.dataBeginTime) {
    //   console.error('WARNING: no this.dataBeginTime', this.dataBeginTime, this.data[0][0]);
    //   this.dataBeginTime = this.data[0][0];
    // }
    // if (!this.dataEndTime) {
    //   this.dataEndTime = this.data[this.data.length - 1][0];
    // }
    // if (
    //   newDataBeginTime.valueOf() != this.dataBeginTime.valueOf() ||
    //   newDataEndTime.valueOf() != this.dataEndTime.valueOf()
    // ) {
    //   this.dataReset = true;
    // }
    if (this.dataReset) {
      console.log('data reset, restore viewport');

      this.displayedData = [];
      this.dataWithDev = [];
      this.dataWithCalDev = [];
      this.setDDandCalcIfNeeded();
      if (this.checkOK4Dev()) {
      }
      this.updateRoundDigits();
      this.dataReset = false;
    }
    if (this.colors && this.colors.length) {
      this.dyGraphOptions['colors'] = this.colors;
      this.Dygraph.updateOptions(
        { colors: this.dyGraphOptions['colors'] },
        true
      );
    }

    this.Dygraph.updateOptions({
      file: this.displayedData,
      labels: this.columnLabels,
      xlabel: this.XLabel,
      axes: this.dyGraphOptions.axes,
      visibility: this.dyGraphOptions.visibility,
      dateWindow: this.dyGraphOptions['dateWindow'],
      customBars: this.showDeviation,
    });
    // setTimeout(() => { // FIXME while c'out?
    //   this.fullZoom();
    // }, 100);

    if (this.minimal && this.data.length > 10) {
      const dateOfSecondPt = this.data[1][0].valueOf();
      const fromZoom = this.Dygraph.xAxisRange()[0];
      if (fromZoom > dateOfSecondPt) {
        console.log('shorten graph');
        this.data.shift();
      }
    }
  }
  waitForData() {
    if (this.data && this.data.length > 1) {
      console.log('waitForData: received data');
      this.handleInitialData();
    } else {
      if (this.data.length == 0 && this.columnLabels.length == 1) {
        this.noData = true;
        this.waiting = false;
        return;
      }
      setTimeout(() => {
        this.waitForData();
      }, 200);
    }
  }
  ngOnInit() {
    this.dyGraphOptions['underlayCallback'] = this.highlightDefaultBackground;

    if (this.minimal) {
      this.options = false;
      this.showDate = false;
      this.YLabel = '';
      this.XLabel = '';
    } else {
      this.dyGraphOptions['legendFormatter'] = this.legendFormatter;
    }

    if (this.enableHighlightCallback) {
      this.dyGraphOptions['highlightCallback'] = this.highlightCallback;
      this.dyGraphOptions['unhighlightCallback'] = this.unhighlightCallback;
    }
    this.dyGraphOptions['ylabel'] = this.YLabel;
    this.dyGraphOptions['xlabel'] = this.XLabel;
    // this.dyGraphOptions['labels'] = this.columnLabels;

    while (
      this.dyGraphOptions.visibility.length <
      this.columnLabels.length - 1
    ) {
      this.dyGraphOptions.visibility.push(true);
    }
    // this.updateXLabel();
    this.updateDyGraphOptions();

    if (
      this.dyGraphOptions['dateWindow'] &&
      this.dyGraphOptions['dateWindow'].length
    ) {
      this.overrideDateWindow[0] = this.dyGraphOptions['dateWindow'][0];
      this.overrideDateWindow[1] = this.dyGraphOptions['dateWindow'][1];
    }

    // this.displayedData = [[undefined, null]];
    this.htmlID = 'graph_' + (Math.random() + 1).toString();
    if (!document['Dygraphs']) {
      document['Dygraphs'] = [];
    }
    document['Dygraphs'][this.htmlID] = this;
    this.dyGraphOptions['labelsDiv'] = 'L_' + this.htmlID;

    // console.log(this.startTime, this.endTime);

    // if (this.startTime) {
    //   [this.dataBeginTime, this.dataEndTime] = this.calculateTimeRange(
    //     this.startTime,
    //     'now',
    //     true
    //   );
    // }

    this.waitForData();
  }

  ngOnDestroy() {
    if (this.Dygraph) {
      this.Dygraph.destroy();
      console.log('DyGraph destroyed');
    }
    delete document['Dygraphs'][this.htmlID];
  }

  updateDyGraphOptions() {
    if (this.minimal) {
      for (const key in this.minimalOptions) {
        if (this.minimalOptions.hasOwnProperty(key)) {
          this.dyGraphOptions[key] = this.minimalOptions[key];
        }
      }
    }

    if (this.checkOK4Dev() && this.dataWithDev && this.dataWithDev.length > 1)
      this.dyGraphOptions['customBars'] = true;
    else this.dyGraphOptions['customBars'] = false;

    if (this.rawLabels) {
      for (let i = 1; i < this.rawLabels.length; i++) {
        const metric = this.rawLabels[i]['metric'];
        if (metric == 'disk' || metric == 'mem' || metric == 'swap') {
          this.dyGraphOptions['labelsKMG2'] = true;
          this.dyGraphOptions.labelsKMB = false;
          break;
        }
      }
    }

    // console.log('old:', cloneDeep(this.dyGraphOptions));
    // console.log('with:', cloneDeep(this.extraDyGraphConfig));
    this.h.deepCopyInto(this.dyGraphOptions, this.extraDyGraphConfig);
    // console.log('result', cloneDeep(this.dyGraphOptions));

    this.dyGraphOptions.logscale =
      this.dyGraphOptions.axes.y.logscale // ||
      // this.dyGraphOptions.axes.y2.logscale;

    const yOffset = this.h.getDeep(this.dyGraphOptions, [
      'axes',
      'y',
      'axisLabelWidth',
    ]);
    if (yOffset) {
      this.yO = String(yOffset - 50);
      console.log('yOffset:', this.yO);
    }
    // const y2Offset = this.h.getDeep(this.dyGraphOptions, [
    //   'axes',
    //   'y2',
    //   'axisLabelWidth',
    // ]);
    // if (y2Offset) {
    //   this.y2O = String(y2Offset - 50);
    //   console.log('y2Offset:', this.y2O);
    // }
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
  setYranges() {
    const yranges = this.Dygraph.yAxisRanges();
    this.yRange = yranges[0];
    // if (yranges[1] && yranges[1].length) {
    //   this.y2Range = yranges[1];
    // }
  }
  checkOK4Dev() {
    return (
      this.showDeviation &&
      this.rawLabels &&
      this.data[0] &&
      this.rawLabels.length == this.data[0].length
    );
  }
  checkOK4Cal() {
    return (
      this.calibrate &&
      this.rawLabels &&
      this.data[0] &&
      this.rawLabels.length == this.data[0].length
    );
  }
  toggleDeviation() {
    this.setDDandCalcIfNeeded();
    this.Dygraph.updateOptions({
      file: this.displayedData,
      customBars: this.showDeviation,
    });
  }
  toggleCalibration() {
    this.setDDandCalcIfNeeded();
    this.Dygraph.updateOptions({
      file: this.displayedData,
    });
    // this.updateAverages();
  }
  setDDandCalcIfNeeded() {
    // 1st step: calibrate data
    if (this.checkOK4Cal()) {
      if (this.calibratedData.length != this.data.length) {
        this.calibratedData = this.gss.returnCalibratedData(
          this.data,
          this.rawLabels
        );
      }
      this.displayedData = this.calibratedData;
    } else {
      this.displayedData = this.data;
    }
    // 2nd step: calc dev, if whished
    if (this.checkOK4Dev()) {
      if (this.checkOK4Cal()) {
        if (this.dataWithCalDev.length != this.data.length) {
          this.dataWithCalDev = this.sensorService.returnDataWithDeviations(
            this.calibratedData,
            this.rawLabels
          );
        }
        this.displayedData = this.dataWithCalDev;
      } else {
        // cal == no
        if (this.dataWithDev.length != this.data.length) {
          this.dataWithDev = this.sensorService.returnDataWithDeviations(
            this.data,
            this.rawLabels
          );
        }
        this.displayedData = this.dataWithDev;
      }
    }
  }

  calcXranges() {
    let xmax = -Infinity;
    let xmin = Infinity;
    for (let i = 0; i < this.data.length; i++) {
      const x = this.data[i][0];
      if (x > xmax) {
        xmax = x
      }
      if (x < xmin) {
        xmin = x
      }
    }
    return [xmin, xmax];
  }

  handleInitialData() {
    if (!this.data.length) {
      console.error('no data');
      this.noData = true;
      return;
    }
    if (!this.columnLabels || !this.columnLabels.length) {
      console.error('you have to supply correct columnLabels');
      return;
    }
    this.noData = false;

    this.updateRoundDigits();

    this.dyGraphOptions['ylabel'] = this.YLabel;
    this.dyGraphOptions['xlabel'] = this.XLabel;

    // console.log('startin auto unit label for', this.YLabel);
    // if (this.YLabel.search(/\(.*\)$/) == -1) {
    //   let newYlabel = this.YLabel;
    //   let units = [];
    //   let units2 = [];
    //   for (let i = 0; i < this.columnLabels.length; i++) {
    //     const serieslabel = this.columnLabels[i];
    //     const unit = serieslabel.match(/\((.*)\)$/);
    //     // console.log(unit, serieslabel);

    //     const axis = this.h.getDeep(this.extraDyGraphConfig, [
    //       'series',
    //       serieslabel,
    //       'axis',
    //     ]);
    //     if (axis == 'y2') {
    //       if (unit && units2.indexOf(unit[1]) == -1) {
    //         units2.push(unit[1]);
    //       }
    //     } else {
    //       if (unit && units.indexOf(unit[1]) == -1) {
    //         units.push(unit[1]);
    //       }
    //     }
    //   }
    //   if (units.length) {
    //     newYlabel += ' (' + units.join(', ') + ')';
    //   }
    //   // if (units2.length) {
    //   //   console.log('y2label units:', units2);
    //   //   this.dyGraphOptions['y2label'] =
    //   //     this.Y2Label + ' (' + units2.join(', ') + ')';
    //   // }
    //   // newYlabel += ' (' + (units.length ? units.join(', ') : 'unitless') + ')';
    //   this.dyGraphOptions['ylabel'] = newYlabel;
    // }

    this.dyGraphOptions['labels'] = this.columnLabels;
    // console.log('COLORS:', cloneDeep(this.colors), cloneDeep(this.h.colorArray));

    console.log(cloneDeep(this.dyGraphOptions));
    if (this.columnLabels.length != this.data[0].length) {
      console.error(
        'mismatch columnlabels',
        this.columnLabels,
        'and datalen',
        this.data
      );
      return;
    }
    this.dyGraphOptions['colors'] = this.colors.length
      ? this.colors
      : this.h.colorArray;
    // if (this.backGroundLevels) {
    //   this.dyGraphOptions['backGroundLevels'] = this.backGroundLevels; // option we create ourselves to access without Dygraphs.parent in initial draw call
    // }
    this.updateDyGraphOptions();

    this.waiting = false;
    while (
      this.dyGraphOptions.visibility.length <
      this.columnLabels.length - 1
    ) {
      this.dyGraphOptions.visibility.push(true);
    }
    while (this.roundDigits.length < this.columnLabels.length) {
      this.roundDigits.push(2);
    }

    // calibrations may not be there yet...
    this.setDDandCalcIfNeeded();
    if (this.checkOK4Dev()) {
      this.dyGraphOptions['customBars'] = true;
    }
    // especially for x/y data:
    const validData = [];
    for (let i = 0; i < this.displayedData.length; i++) {
      const row = this.displayedData[i];
      const x = row[0], y = row[1];
      if (typeof x == 'number' && !isNaN(x) && isFinite(x) 
      && typeof y == 'number' && !isNaN(y) && isFinite(y) ) {
        validData.push(row)
      }
    }
    this.displayedData = validData;
    console.log('validData', cloneDeep(validData));
    

    this.dyGraphOptions['dateWindow'] = this.calcXranges();

    console.log(
      'creating Dyg',
      this.htmlID,
      cloneDeep(this.displayedData),
      cloneDeep(this.dyGraphOptions)
    );

    this.Dygraph = new Dygraph(
      this.htmlID,
      this.displayedData,
      this.dyGraphOptions
    );
    this.Dygraph['parent'] = this;
    if (this.runningAvgPoints) {
      this.Dygraph.adjustRoll(this.runningAvgPoints);
    }
    // console.log('handleInitialData: dyoptions', this.dyGraphOptions);
    // console.log('handleInitialData: displayedData', this.displayedData);

    if (this.data.length === 0) {
      // FIXME isn't this catched by first check?
      console.log('no initial data, do not attempt to update');
      this.noData = true;
      return;
    }

    this.checkAndUpdateGraphWidth();
    // this.setYranges();
    const yranges = this.Dygraph.yAxisRanges();
    this.yRange = yranges[0];
    this.yFixedRanges.y1min = this.yRange[0];
    this.yFixedRanges.y1max = this.yRange[1];
    this.xRange = this.Dygraph.xAxisRange();
    // if (yranges[1]) {
    //   this.y2Range = yranges[1];
    //   this.yFixedRanges.y2min = this.y2Range[0];
    //   this.yFixedRanges.y2max = this.y2Range[1];
    // }
    console.log('yFixedRanges', this.yFixedRanges);
  }
  updateRoll() {
    this.Dygraph.adjustRoll(this.runningAvgPoints);
  }


  public clickHighLightedPoint = -1;
  clickCallback(e, point) {
    console.log('clickCallback', e, point);

    const tscalm: unknown = this;
    const g: Dygraph = <Dygraph>tscalm;

    const sel = g.getSelection();
    if (g.isSeriesLocked()) {
      console.log('clear selection');

      g.clearSelection();
      if (sel > -1 && g['parent']) {
        g['parent']['clickHighLightedPoint'] = -1;
      }
    } else {
      if (sel > -1 && g['parent']) {
        g['parent']['clickHighLightedPoint'] = sel;
      }
      const highlSeries = g.getHighlightSeries();
      console.log('sel:', sel, 'hl:', highlSeries);
      g.setSelection(sel, undefined, true);
    }
  }

  highlightCallback(event, x, points, row, seriesName) {
    const tscalm: unknown = this;
    const g: Dygraph = <Dygraph>tscalm;

    // note: do not use log scale, dygraph does return only displayed data (no values == 0)
    if (!this.hasOwnProperty('parent')) {
      console.error('highlightCallback: No parent');
      return;
    }
    const parent = g['parent'];

    const values = { points: points, seriesName: seriesName };
    parent.returnHighlightedRow.emit(values);
    const sel = parent['clickHighLightedPoint'];
    if (sel > -1) {
      g.setSelection(sel);
    }
    // console.log(parent['clickHighLightedPoint']);

  }
  unhighlightCallback(event) {
    const tscalm: unknown = this;
    const g: Dygraph = <Dygraph>tscalm;

    if (!g.isSeriesLocked()) {
      g.clearSelection();
    }
    if (g.numAxes() < 2 || !this['parent']) {
      return;
    }
    // console.log('unhighlight');
    // console.log(event);
    const classList = document.getElementById(this['parent'].htmlID).classList;
    classList.remove('y1');
    classList.remove('y2');
  }
  toggleLegendContent(id = '') {
    this.legendContentVisible = !this.legendContentVisible;
    if (id) {
      const classList = document.getElementById('L_' + id).classList;
      if (classList.contains('cthide')) {
        classList.remove('cthide');
      } else {
        classList.add('cthide');
      }
    }
  }
  legendFormatter(data) {
    // console.log(data.dygraph);
    const parent = this['parent'];
    const showDevs = parent && parent.showDeviation;

    // let html = '<table>';
    // html += '<tr><th colspan="3" class="header">' + (data.xHTML ? data.xHTML + ':' : 'Legend:') + '</th></tr>';
    const htmlID = parent ? parent['htmlID'] : '';
    const toggleScript = htmlID
      ? `onclick="document['Dygraphs']['${htmlID}'].toggleLegendContent('${htmlID}')"`
      : '';
    let html =
      '<div class="header">Legend: ' +
      (data.xHTML ? ' values @ ' + data.xHTML : '') +
      `</div><div class="legendToggle" ${toggleScript} title="click to toggle legend">&nbsp;</div>`;
    html += '<table>';

    // console.log(htmlID);
    function genToggle(label, htmlID) {
      return htmlID
        ? `onmousedown="document['Dygraphs']['${htmlID}'].tVis4Label('${label}');" `
        : '';
    }
    function genHover(label, htmlID) {
      return htmlID
        ? `onmouseover="document['Dygraphs']['${htmlID}'].selectSeries('${label}');"`
        : '';
    }
    function genSingleClick(label, htmlID) {
      return htmlID
        ? `onmousedown="document['Dygraphs']['${htmlID}'].showSingle('${label}');" `
        : '';
    }

    const nrSeries = data.series.length;
    let currentUnit = '';
    let currentIndex = -1;
    let currentY = -Infinity;
    const units = [];
    for (let i = 0; i < nrSeries; i++) {
      const series = data.series[i];
      const unitArr = series.labelHTML.match(/\((.*)\)$/);
      if (unitArr) {
        units[i] = unitArr[1];
        if (series.isHighlighted) {
          currentUnit = unitArr[1];
          currentIndex = i;
          currentY = series.y;
        }
      } else {
        units[i] = '';
      }
    }
    let seriesWithSameUnit = 0;
    if (currentUnit) {
      for (let i = 0; i < nrSeries; i++) {
        if (i == currentIndex) {
          continue;
        }
        if (currentUnit == units[i]) {
          seriesWithSameUnit += 1;
        }
      }
    }

    for (let i = 0; i < nrSeries; i++) {
      const series = data.series[i];
      const displayedValue =
        !series.hasOwnProperty('y') || isNaN(series.y)
          ? ''
          : parent.h
              .roundAccurately(series.y, parent.roundDigits[i + 1])
              .toLocaleString();
      const isHighlighted = series.isHighlighted;
      const cls = isHighlighted ? 'class="highlight"' : '';
      const hoverCallback = genHover(series.label, htmlID);
      const toggleCallback = genToggle(series.label, htmlID);
      const setSingleCallback = genSingleClick(series.label, htmlID);
      const textcolor = series.isVisible ? '' : ' style="color:gray" ';

      const labeltext = series.labelHTML.replace(/\s?\((.*)\)$/, '');
      let valcells = '';
      let colon = '';
      if (data.x) {
        valcells = `<td ${toggleCallback} class='value'>${displayedValue}</td>`;

        if (showDevs) {
          let devtext = '';
          if (!isNaN(series.y)) {
            const yvalues = parent.getDeviationsofTS(data.x);
            const values = yvalues[i + 1];
            if (Array.isArray(values)) {
              const dlower = parent.h.roundAccurately(
                values[1] - values[0],
                parent.roundDigits[i + 1]
              );
              const dupper = parent.h.roundAccurately(
                values[2] - values[1],
                parent.roundDigits[i + 1]
              );
              if (dlower == dupper) {
                devtext = dlower ? '±' + String(dlower) : ''; // if no dev defined
              } else {
                devtext = '-' + String(dlower) + ' +' + String(dupper);
              }
            }
          }
          valcells += `<td class="d" ${toggleCallback}>` + devtext + '</td>';
        }

        colon = ':';
      }

      const unit = units[i];
      const unittext = data.x || !unit ? unit : '(' + unit + ')';
      valcells += `<td class='u'${textcolor} ${toggleCallback}>${unittext}</td>`;
      if (data.x && seriesWithSameUnit > 0) {
        valcells += `<td class='c' ${toggleCallback}>`;

        if (!isNaN(series.y)) {
          let compareText = '';
          if (unit == currentUnit) {
            if (i == currentIndex) {
              valcells = valcells.replace(/class='c'/, "class='s'");
              compareText = '•';
            } else {
              compareText = 'Δ ';
              const diff = series.y - currentY;
              if (diff > 0) {
                compareText += '+';
              }
              compareText +=
                String(
                  parent.h.roundAccurately(diff, parent.roundDigits[i + 1])
                ) +
                '&thinsp;' +
                unit;
            }
          }
          valcells += compareText;
        }
        valcells += '</td>';
      }
      html +=
        `<tr style='color:${series.color};' ${cls} ${hoverCallback} title='Toggle Display'>` +
        `<th${textcolor} class="h"><span class='dash'>${series.dashHTML}</span><span class='one' ${setSingleCallback} title='Display alone'>[1]</span></th>` +
        `<th${textcolor} ${toggleCallback}>${labeltext}${colon}</th>` +
        `${valcells}</tr>`;
    }
    return html + '</table>';
  }
  selectSeries(name: string) {
    // this.Dygraph.clearSelection();
    const highlightedRow =
      this.clickHighLightedPoint > -1 ? this.clickHighLightedPoint : false;
    this.Dygraph.setSelection(highlightedRow, name);
}
  getDeviationsofTS(ts, debug = false) {
    // search for complete data row at timestamp (incl. deviations) for display in legend
    const datalen = this.data.length; // use data, array has a lower memory footprint
    let firstindex = 0;
    let firstts;
    //
    let lastindex = datalen - 1;
    let lastts;
    let timeoutcounter = 0;

    const logoffset = this.data[0][0].valueOf();
    while (timeoutcounter++ < 99) {
      firstts = this.data[firstindex][0].valueOf();
      if (firstts == ts) {
        return this.displayedData[firstindex];
      }
      lastts = this.data[lastindex][0].valueOf();
      if (lastts == ts) {
        return this.displayedData[lastindex];
      }
      if (debug) {
        console.log(
          'BS count:',
          timeoutcounter,
          'firsti:',
          firstindex,
          'lasti:',
          lastindex,
          'firstts',
          (firstts - logoffset) / 1000,
          'target',
          (ts - logoffset) / 1000,
          'lastts',
          (lastts - logoffset) / 1000
        );
      }
      const new_half_ts = firstts + (lastts - firstts) / 2; // overshoots ?
      const new_half_index =
        firstindex + Math.floor((lastindex - firstindex) / 2);
      const new_half_index_ts = this.data[new_half_index][0]; // overshoots ?
      if (ts < new_half_index_ts) {
        lastindex = new_half_index;
      } else {
        firstindex = new_half_index;
      }
    }
    console.error('getDeviationsofTS Timeout');

    console.log(
      'BS count:',
      timeoutcounter,
      'firsti:',
      firstindex,
      'lasti:',
      lastindex,
      'firstts',
      (firstts - logoffset) / 1000,
      'target',
      (ts - logoffset) / 1000,
      'lastts',
      (lastts - logoffset) / 1000
    );
    if (!debug) this.getDeviationsofTS(ts, true);
  }

  // gets called after AfterDrawCallback
  afterZoomCallback(
    minDate: number,
    maxDate: number,
    yRanges?: Array<Array<number>>
  ) {
    const debugflag = true;
    if (debugflag) {
      console.log('after dygraph zoom callback');
      console.log(typeof minDate, minDate, maxDate, yRanges);
      return;
    }

    if (this.hasOwnProperty('parent')) {
      const parent = this['parent'];
      console.log(yRanges[0]);

      // console.log(
      //   'change in XRange',
      //   Math.floor(minDate),
      //   parent.fromZoom.valueOf(),
      //   Math.floor(maxDate),
      //   parent.toZoom.valueOf()
      // );
      // if (
      //   Math.floor(minDate) != parent.fromZoom.valueOf() ||
      //   Math.floor(maxDate) != parent.toZoom.valueOf()
      // ) {
      //   console.log('change');
      // }
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
  checkAndUpdateGraphWidth() {
    const area = this.Dygraph.getArea();
    const graphWidthPx = area.w;
    if (this.graphWidthPx !== graphWidthPx) {
      this.graphWidthPx = graphWidthPx;
      console.log('new graph width:', graphWidthPx);
      this.returnGraphWidthOnChange.emit(graphWidthPx);
    }
  }

  afterDrawCallback(g: Dygraph, isOInitial: boolean) {
    const debugflag = true;
    if (isOInitial) {
      console.log('ignoring initial afterDrawCallback');
      return;
    }
    if (debugflag) {
      console.log('after dygraph draw callback');
    }
    if (!g.hasOwnProperty('parent')) {
      console.error('afterDrawCallback: no parent');
      return;
    }
    const parent = g['parent'];
    if (!parent['displayedData'].length) {
      console.log('afterDrawCallback: no data');
      return;
    }

    const yranges = g.yAxisRanges();
    parent.yRange = yranges[0];
    // if (yranges[1] && yranges[1].length) {
    //   parent.y2Range = yranges[1];
    // }

    const [from, to] = g.xAxisRange();
    // parent.fromZoom = new Date(from);
    // parent.toZoom = new Date(to);
    // parent.updateFromToPickers();
    this.xRange = [from, to]

    const newXrange = (to - from) / 1000;
    if (newXrange != parent.currentXrange) {
      parent.currentXrange = newXrange;

      // this['updateOptions']({ xlabel: parent.returnXrangeText(newXrange) });
    }

    if (debugflag) {
      const dw = g.getOption('dateWindow');
      console.log('xr:', from, to, 'dw:', dw[0], dw[1]);
    }

    parent.returnCurrentZoom.emit([from, to]);
    parent.checkAndUpdateGraphWidth();
  }

  
  resetData() {
    // this.lastReset = new Date();
    while (this.data.length) {
      this.data.pop(); // fastest way to clear array
    }

    this.dataWithDev = this.data;
    this.displayedData = this.data;
    this.Dygraph.updateOptions({ file: this.displayedData });
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
  highlightDefaultBackground(canvas, area, g) {
    const graphbg = g.hasOwnProperty('parent')
      ? g.parent.graphBackGroundColor
      : '#3F3F3F';
    canvas.fillStyle = graphbg;
    canvas.fillRect(area.x, area.y, area.w, area.h);
  }
  
  toggleOptions() {
    this.optionsOpen = !this.optionsOpen;
    this.resize();
  }
  public resize(t = 150) {
    setTimeout(() => {
      this.Dygraph.resize(undefined, undefined);
    }, t);
  }

 

  fullZoom() {
    this.Dygraph.resetZoom();
  }
  zoom(factor: number) {
    // if (this.fromZoom !== undefined && this.toZoom !== undefined) {
      // const fromValue = this.fromZoom.valueOf();
      // const toValue = this.toZoom.valueOf();
      const [fromValue, toValue] = this.Dygraph.xAxisRange();

      const difference = toValue - fromValue;
      const distanceToCenter = difference / 2;
      // const center = fromValue + distanceToCenter;

      const newdifference = factor * difference;
      const newDistanceToCenter = newdifference / 2;
      const newFrom = fromValue + (distanceToCenter - newDistanceToCenter) * 0.99;
      const newTo = toValue - (distanceToCenter - newDistanceToCenter) * 1.01; // offset for avoiding no reloading on auto zoom

      // this.toZoom = new Date(newTo);
      // this.fromZoom = new Date(newFrom);
      this.Dygraph.updateOptions({
        dateWindow: [newFrom, newTo],
      });
    // }
  }

  //note: if logscale not globally set, no logscale graphs are displayed
  switchLogScale(axis = 'y1') {
    let axisob = this.dyGraphOptions['axes'];
    let y = axis == 'y2' ? 'y2' : 'y';
    if (!axisob.hasOwnProperty(y)) {
      axisob[y] = {};
    }

    axisob[y]['logscale'] = axisob[y]['logscale'] ? false : true;
    this.Dygraph.updateOptions({
      logscale: axisob.y.logscale, //|| axisob.y2.logscale,
      axes: this.dyGraphOptions['axes'],
    });
    console.log(
      'new logscale:',
      axis,
      axisob[y]['logscale'],
      this.dyGraphOptions['axes']
    );
  }
  toggleSeparatedPoints() {
    this.Dygraph.updateOptions({
      connectSeparatedPoints: this.dyGraphOptions.connectSeparatedPoints,
    });
    console.log(
      'new connectSeparatedPoints:',
      this.dyGraphOptions.connectSeparatedPoints
    );
  }
  toggleLegend() {
    if (this.dyGraphOptions.legend == 'always') {
      this.dyGraphOptions.legend = 'never';
    } else {
      this.dyGraphOptions.legend = 'always';
    }

    this.Dygraph.updateOptions({
      legend: this.dyGraphOptions.legend,
    });
  }



  // changeRange(param) {
  //   console.log(['changeRange', param]);
  //   let startDate: Date;
  //   let endDate: Date;

  //   endDate = new Date(); // this.endTime === 'now' ? new Date() : new Date(this.endTime);

  //   const seconds = this.zoomValue * this.zoomMultiplicator;
  //   startDate = new Date(endDate.valueOf() - seconds * 1000);

  //   this.fromZoom = startDate;
  //   this.toZoom = endDate;
  //   this.Dygraph.updateOptions({
  //     dateWindow: [startDate.valueOf(), endDate.valueOf()],
  //   });
  // }

  exportCSV(data?) {
    const labels = this.dyGraphOptions['labels'];
    if (!data) {
      data = this.data; // this.h.returnDataRange(this.data, this.fromZoom, this.toZoom);
    }
    let visibleLabels = [labels[0]]; // Date
    for (let i = 1; i < labels.length; i++) {
      if (this.dyGraphOptions.visibility[i - 1]) {
        visibleLabels.push(labels[i]);
      }
    }
    let visibleData = [];
    for (let r = 0; r < data.length; r++) {
      const origRow = data[r];
      let newRow = [origRow[0]]; // Timestamp
      for (let c = 0; c < origRow.length; c++) {
        if (this.dyGraphOptions.visibility[c - 1]) {
          newRow.push(this.h.roundAccurately(origRow[c], this.roundDigits[c]));
        }
      }
      visibleData.push(newRow);
    }
    this.h.exportCSV(visibleData, visibleLabels, this.exportUTC);
  }
  
  
  tVis4Label(label: string) {
    // console.log('tVis4Label with', label);
    for (let i = 1; i < this.columnLabels.length; i++) {
      const ilabel = this.columnLabels[i];
      if (label == ilabel) {
        // console.log(i, ilabel);
        this.dyGraphOptions.visibility[i - 1] =
          !this.dyGraphOptions.visibility[i - 1];
        break;
      }
    }
    this.showAllifNone();
    this.Dygraph.updateOptions({
      visibility: this.dyGraphOptions.visibility,
    });
  }
  showAllifNone() {
    // console.log('show all?', this.dyGraphOptions.visibility);
    let everythingHidden = true;
    for (let i = 0; i < this.dyGraphOptions.visibility.length; i++) {
      if (this.dyGraphOptions.visibility[i] === true) {
        everythingHidden = false;
        break;
      }
    }
    if (everythingHidden) {
      for (let i = 0; i < this.dyGraphOptions.visibility.length; i++) {
        this.dyGraphOptions.visibility[i] = true;
      }
    }
  }
  showSingle(label: String) {
    console.log('single', label);

    for (let i = 1; i < this.columnLabels.length; i++) {
      const ilabel = this.columnLabels[i];
      this.dyGraphOptions.visibility[i - 1] = label == ilabel ? true : false;
    }
    this.Dygraph.updateOptions({
      visibility: this.dyGraphOptions.visibility,
    });
  }
  
  toggleYRSel(sel: string) {
    this.yRSelShown[sel] = !this.yRSelShown[sel];
  }
  changeYMode($event, sel) {
    // also gets called when number input box is changed
    console.log('changeYMode', $event, sel);
    if (sel == 'y1min' || sel == 'y1max') {
      const r: [number, number] = [null, null];
      if (this.yModes.y1min == 'fix') {
        r[0] = this.yFixedRanges.y1min;
        if (this.dyGraphOptions.axes.y.logscale && r[0] <= 0) {
          alert('Ymin ≤ 0 not possible in log scale view');
          this.yFixedRanges.y1min = 1;
          return;
        }
      }
      if (this.yModes.y1max == 'fix') {
        r[1] = this.yFixedRanges.y1max;
        if (this.dyGraphOptions.axes.y.logscale && r[1] <= 0) {
          alert('Ymax ≤ 0 not possible in log scale view');
          this.yFixedRanges.y1max = 1;
          return;
        }
      }
      this.dyGraphOptions.axes.y['valueRange'] = r;
      this.Dygraph.updateOptions({
        axes: this.dyGraphOptions.axes,
      });
    }
    // if (sel == 'y2min' || sel == 'y2max') {
    //   const r: [number, number] = [null, null];
    //   if (this.yModes.y2min == 'fix') {
    //     r[0] = this.yFixedRanges.y2min;
    //     if (this.dyGraphOptions.axes.y2.logscale && r[0] <= 0) {
    //       alert('Y2min ≤ 0 not possible in log scale view');
    //       this.yFixedRanges.y2min = 1;
    //       return;
    //     }
    //   }
    //   if (this.yModes.y2max == 'fix') {
    //     r[1] = this.yFixedRanges.y2max;
    //     if (this.dyGraphOptions.axes.y2.logscale && r[1] <= 0) {
    //       alert('Y2min ≤ 0 not possible in log scale view');
    //       this.yFixedRanges.y2max = 1;
    //       return;
    //     }
    //   }
    //   this.dyGraphOptions.axes.y2['valueRange'] = r;
    //   this.Dygraph.updateOptions({
    //     axes: this.dyGraphOptions.axes,
    //   });
    // }
  }
}
