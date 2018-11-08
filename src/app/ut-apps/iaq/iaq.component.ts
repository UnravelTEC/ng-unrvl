import { Component, OnInit } from '@angular/core';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

//import { EventEmitter} from '@angular/core';

@Component({
  selector: 'app-iaq',
  templateUrl: './iaq.component.html',
  styleUrls: ['./iaq.component.css']
})
export class IaqComponent implements OnInit {

  /*@Input() item: any;
  @Output() itemChange = new EventEmitter();*/

  currentData = {
    timestamp: 0,
    value: 47
  };
  CO2_value = 0;

  constructor(private utFetchdataService: UtFetchdataService) {}

  ngOnInit() {
    this.getData();
  }

  url = 'http://belinda.cgv.tugraz.at:9090/api/v1/query?query=co2{location="FuzzyLab",sensor="scd30"}';

  getData() {
    this.utFetchdataService.getHTTPData(this.url).subscribe(
      (data: SingleValue) => {
        this.currentData = {
          timestamp: data['data']['result'][0]['value'][0] * 1000,
          value: parseFloat(data['data']['result'][0]['value'][1])
        };
        this.callNext();
      }
      //this.saveDataAndCallNext
      );
  }

  saveDataAndCallNext(data: SingleValue) {
    //console.log(data);
    this.currentData = {
      timestamp: data['data']['result'][0]['value'][0] * 1000,
      value: parseFloat(data['data']['result'][0]['value'][1])
    };
    /*console.log(this.currentData.value)
    console.log(this.currentData.timestamp)
    setTimeout(this.getData, 1000);*/
  }
  callNext() {
    setTimeout(this.getData, 1000);
  }
//Problem: update gets not emitted when called via non-arrow-function


}

export interface SingleValue {
  timestamp: number;
  value: string;
}
