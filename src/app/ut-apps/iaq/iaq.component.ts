import { Component, OnInit } from '@angular/core';
import { UtFetchdataService } from '../../ut-fetchdata.service';

@Component({
  selector: 'app-iaq',
  templateUrl: './iaq.component.html',
  styleUrls: ['./iaq.component.css']
})
export class IaqComponent implements OnInit {
  currentData = {
    timestamp: 0,
    value: 47
  };
  CO2_value = 0;

  constructor(private utFetchdataService: UtFetchdataService) {}

  ngOnInit() {
    this.getData();
  }

  getData() {
    this.utFetchdataService.getHTTPData().subscribe(
      (data: singleValue) =>
        (this.currentData = {
          timestamp: data['data']['result'][0]['value'][0] * 1000,
          value: parseFloat(data['data']['result'][0]['value'][1])
        })
    );
  }
}

export interface singleValue {
  timestamp: number;
  value: string;
}
