import { Component } from '@angular/core';
import { GlobalSettingsService } from 'app/core/global-settings.service';
import { HelperFunctionsService } from 'app/core/helper-functions.service';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { cloneDeep } from 'lodash-es';

@Component({
  selector: 'app-annotations',
  templateUrl: './annotations.component.html',
  styleUrl: './annotations.component.scss'
})
export class AnnotationsComponent {
  public annotationTable = [];
  public NumAn = 0;

  constructor(public gss: GlobalSettingsService, private utHTTP: UtFetchdataService, private h: HelperFunctionsService,) {
    this.gss.emitChange({ appName: 'Annotations' });
  }
  ngOnInit() {
    console.log("ngOnInit");

    this.getAnnotations()
  }
  getAnnotations() {

    if (!this.gss.influxReady()) {
      setTimeout(() => {
        this.getAnnotations();
      }, 100);
      return;
    }

    this.utHTTP
      .getHTTPData(
        this.utHTTP.buildInfluxQuery("SELECT * FROM annotations GROUP BY *", undefined, undefined)
      )
      .subscribe(
        (data: Object) => this.acceptAnnotations(data),
        (error) => {
          console.log('getAnnotations: Error following:');
          this.gss.displayHTTPerror(error);
        }
      );
  }
  acceptAnnotations(data) {
    console.log('acceptAnnotations', data);

    const series = this.h.getDeep(data, ['results', 0, 'series'])
    if (!series) {
      this.annotationTable = [];
      console.log('no annos');
      return
    }
    console.log(series);

    series.forEach(seri => {
      const note_col = seri['columns'].indexOf('note')
      const time_col = seri['columns'].indexOf('A_time')
      const stags = seri['tags']
      const commonAnno = { field: stags['A_field'], measurement: stags['A_measurement'], OP: stags['A_operation'] }
      commonAnno['origtags'] = cloneDeep(stags)

      const commonAnnoTagArr = []
      for (const key in stags) {
        if (key.startsWith("A_"))
          continue
        const value = stags[key];
        if (value != "") {
          commonAnnoTagArr.push(key + ": " + value)
        }
      }
      commonAnno['tags'] = this.h.createSortedTagString(commonAnnoTagArr)

      seri['values'].forEach(row => {
        const annoObj = cloneDeep(commonAnno)
        annoObj['time'] = row[time_col]
        annoObj['note'] = row[note_col]
        if (annoObj['OP'] == "D") {
          for (let i = 0; i < this.annotationTable.length; i++) {
            const row = this.annotationTable[i];
            if (annoObj['time'] == row['time']
              && annoObj['tags'] == row['tags']
              && annoObj['field'] == row['field']
              && annoObj['measurement'] == row['measurement']) {
              this.annotationTable.splice(i, 1)
              break
            }
          }
        } else {
          if (annoObj['field']) {

            annoObj['queryParams'] = {
              measurement: annoObj['measurement'],
              value: "/^" + annoObj['field'] + "$/",
              from: annoObj['time'] -60000,
              to: annoObj['time'] + 3600000 -60000,
              referrer: "Annotations"
            }
            if (annoObj['origtags']['sensor']) {
              annoObj['queryParams']['sensor'] = annoObj['origtags']['sensor']
            }
            if (annoObj['origtags']['id']) {
              annoObj['queryParams']['id'] = annoObj['origtags']['id']
            }
            this.annotationTable.push(annoObj)
          }
        }
        // console.log(annoObj);
      });
    });
    // search for col nr, to use short_label index
    // for (let i = 0; i < new_annotationTable.length; i++) {
    //   const annoObj = new_annotationTable[i];
    //   const tmpOrigLabel4Cmp = annoObj['measurement'] + ' ' + annoObj['tags'] + ' ' + annoObj['field']
    //   let dygLabel = ""
    //   for (let o = 0; o < this.orig_labels.length; o++) {
    //     if (tmpOrigLabel4Cmp == this.orig_labels[o]) {
    //       dygLabel = this.short_labels[o]
    //       annoObj['dygColumnNr'] = o + 1 // to compensate for no Date column in short- and orig_labels
    //       break
    //     }
    //   }
    //   if (!dygLabel) {
    //     console.log("!dygLabel", tmpOrigLabel4Cmp, 'in', this.orig_labels);
    //   }
    //   // time has to be matched to nearest data point for Dyg to attach it
    //   const origAnnoTsMS = annoObj['time']
    //   const newAnnoTsMS = this.h.findNearestDataTS(this.data, origAnnoTsMS)
    //   let shortext = '×'
    //   if (origAnnoTsMS < newAnnoTsMS) {
    //     shortext = '<'
    //   }
    //   if (origAnnoTsMS > newAnnoTsMS) {
    //     shortext = '>'
    //   }

    //   const dygAnno = { series: dygLabel, text: annoObj["note"], shortText: shortext, xval: newAnnoTsMS }
    //   new_dygAnnos.push(dygAnno)
    // }

    this.NumAn = this.annotationTable.length

    console.log("annotationTable", this.annotationTable);

    this.sort("time")
  }

  private sortTimeOrderAsc = false;
  private sortOrder = {
    measurement: true,
    tags: true,
    field: true,
    note: true
  }
  sort(key: string) {
    if (key == "time") {
      if (this.sortTimeOrderAsc) {
        this.annotationTable.sort((a, b) => a.time - b.time)
      } else {
        this.annotationTable.sort((a, b) => b.time - a.time)
      }
      this.sortTimeOrderAsc = !this.sortTimeOrderAsc;
      return
    }

    if (this.sortOrder[key]) {
      this.annotationTable.sort((a, b) => {
        if (a[key] > b[key]) {
          return 1
        }
        if (a[key] < b[key]) {
          return -1
        }
        return 0
      })
    } else {
      this.annotationTable.sort((a, b) => {
        if (a[key] > b[key]) {
          return -1
        }
        if (a[key] < b[key]) {
          return 1
        }
        return 0
      })
    }
    this.sortOrder[key] = !this.sortOrder[key]
  }

}
