import { Component, OnInit } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { HelperFunctionsService } from 'app/core/helper-functions.service';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';

@Component({
  selector: 'app-scatterplot',
  templateUrl: './scatterplot.component.html',
  styleUrls: ['./scatterplot.component.scss']
})
export class ScatterplotComponent implements OnInit {

  public queryRunning = false;

  public autoreload = false;

  public Ms = ["querying..."]; // measurements from influx
  // public Series = { '$m': { 'common_tags': "...", "differenting_tags": [] } }; // { "$k1": [], "k2": [] } } };
  public Series_per_m = {}; // { $m: [] }
  public M1 = "none set yet"; // chosen measurement 1
  public M2 = "none set yet2"; // chosen measurement 2

  public S1 = "";
  public S2 = "";

  public FK1 = "";
  public FK2 = "";

  public fieldKeys = {} // # { $M: [] }

  public key_ignore_list = ['host', 'topic'];

  public data = [];
  public labels = [];
  raw_labels = [];
  public show_deviation = false;


  y2label = 'M2';

  extraDyGraphConfig = {
    // connectSeparatedPoints: true,
    pointSize: 3,
    logscale: false,
    series: {
      'S2': {
        axis: 'y2',
      },
    },

    axes: {
      y2: {
        independentTicks: true, // default opt here to have a filled object to access later
        // axisLabelWidth: 60, // set on demand
      },
    },
  };

  public dygStartTime: string;
  ylabel = '';

  constructor(private globalSettings: GlobalSettingsService, private utHTTP: UtFetchdataService, private h: HelperFunctionsService) {
    this.globalSettings.emitChange({ appName: 'Corellation' });
  }


  ngOnInit() {
    this.launchMs('show series');
  }

  launchMs(clause: string) {
    if (!this.globalSettings.influxReady()) {
      setTimeout(() => {
        this.launchMs(clause);
      }, 1000);
      return;
    }
    const q = this.utHTTP.buildInfluxQuery(clause);
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.handleMs(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }

  handleMs(data: Object) {
    // console.log('received', data);
    const series = this.h.getDeep(data, ['results', 0, 'series', 0, 'values']);
    console.log('series', series);
    this.Ms = [];
    const Series_per_m = {}; // { $m: [] }
    for (let i = 0; i < series.length; i++) {
      const seri = series[i][0];
      const m_and_tags = seri.split(',')
      const measurement = m_and_tags[0];
      if (measurement == 'calibrations') {
        continue;
      }
      if (!this.Ms.includes(measurement)) {
        this.Ms.push(measurement);
      }

      // const all_tags_per_series_per_m = {}
      // const common_tags = {}
      // const differenting_tags = {}

      const this_series_tags = [];
      for (let i = 1; i < m_and_tags.length; i++) {
        const k_is_v = m_and_tags[i];
        const element = k_is_v.split("=");
        const k = element[0];
        if (this.key_ignore_list.includes(k)) {
          continue;
        }
        const v = element[1];
        this_series_tags.push(k_is_v);
      }

      if (!this.Series_per_m[measurement]) {
        this.Series_per_m[measurement] = []
      }
      this.Series_per_m[measurement].push(this_series_tags.join(", "));



      //   if (!all_tags[k])
      //     all_tags[k] = [];
      //   all_tags[k].push(v);
      // }

      // if (!this.Series[measurement]) {
      //   this.Series[measurement] = [m_and_tags[1]];
      // } else {
      //   this.Series[measurement].push(m_and_tags[1])
      // }
    }
    console.log(this.Series_per_m);

    const q = this.utHTTP.buildInfluxQuery("show field keys on " + this.globalSettings.server.influxdb);
    this.utHTTP.getHTTPData(q).subscribe(
      (data: Object) => this.handleFieldKeys(data),
      (error) => this.globalSettings.displayHTTPerror(error)
    );
  }
  handleFieldKeys(data) {
    console.log("handleFieldKeys");
  
    console.log(data);
    const series = this.h.getDeep(data, ['results', 0, 'series']);
    console.log('series', series);

    for (let i = 0; i < series.length; i++) {
      const element = series[i];
      const m = element['name'];
      this.fieldKeys[m] = [];
      element['values'].forEach(fk => {
        if (fk[1] == 'float' || fk[1] == 'integer') {
          this.fieldKeys[m].push(fk[0])  
        }
      });
      
    }
    console.log(this.fieldKeys);
    
  }

  changeM1() { 
    if (this.Series_per_m[this.M1].length == 1) {
      this.S1 = this.Series_per_m[this.M1][0]
    } else {
      this.S1 = "";
    }
    if (this.fieldKeys[this.M1].length == 1) {
      this.FK1 = this.fieldKeys[this.M1][0]
    } else {
      this.FK1 = "";
    }
  }
  changeM2() { 
    if (this.Series_per_m[this.M2].length == 1) {
      this.S2 = this.Series_per_m[this.M2][0]
    } else {
      this.S2 = "";
    }
    if (this.fieldKeys[this.M2].length == 1) {
      this.FK2 = this.fieldKeys[this.M2][0]
    } else {
      this.FK2 = "";
    }
  }
  changeS1() { }
  changeS2() { }

  reloadS1() {
    console.log("reloadS1");
    
    alert("S1 !")
    // if (this.from && this.to) {
    //   this.from = Number(this.from);
    //   this.to = Number(this.to);
    //   this.updateFromToTimes([this.from, this.to], this.interval);
    //   this.reload(true);
    // } else {
    //   this.reload();
    // }
  }
}


/* 
  todos : 
  * switch X/Y (S1 und S2)
  * select database points
*/