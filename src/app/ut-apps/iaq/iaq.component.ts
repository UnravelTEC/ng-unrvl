import { Component, OnInit } from '@angular/core';
import { UtFetchdataService } from '../../shared/ut-fetchdata.service';

import { interval, Subscription } from 'rxjs';

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

    this.intervalSubscription = interval(1000).subscribe(counter => {
      this.getData();
    });
  }

  url =
    'http://belinda.cgv.tugraz.at:9090/api/v1/query?query=co2{location="FuzzyLab",sensor="scd30"}';
  private requests_underway = 0; //don't flood the server if it is not fast enough

  intervalSubscription: Subscription;

  getData() {
    //console.log(this.requests_underway);
    if (this.requests_underway > 0) {
      console.log('not sending data request, one on the way already');
      return;
    }
    if (this.requests_underway > 5) {
      console.error('5 requests on the way, none returned, check server conn.');
      return;
    }
    this.requests_underway++;
    this.utFetchdataService
      .getHTTPData(this.url)
      .subscribe((data: SingleValue) => {
        this.requests_underway--;
        this.currentData = {
          timestamp: data['data']['result'][0]['value'][0] * 1000,
          value: parseFloat(data['data']['result'][0]['value'][1])
        };
      });
  }
}


export interface SingleValue {
  timestamp: number;
  value: string;
}
