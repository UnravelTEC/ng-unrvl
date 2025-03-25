import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import * as Paho from 'paho-mqtt';

// import cloneDeep from 'lodash-es/cloneDeep';

@Component({
  selector: 'app-evaporator',
  templateUrl: './evaporator.component.html',
  styleUrls: ['./evaporator.component.scss']
})
export class EvaporatorComponent implements OnInit, OnDestroy {
  status = 'init'; // | connecting | connected | failed | lost
  public disconnects = 0;
  private client;
  private clientID = 'clientID_' + String(Math.random() * 100);
  // public topic = '+/sensors/SPS30/particulate_matter_typpartsize_um';

  public topic = '#';

  public mqttMessages = [
    { date: new Date(), topic: 'sample topic', payload: 'sample payload' }
  ];
  public retainedMqttMessages = [];
  public maxlen = 3;
  public updateMessages = true;

  public dygData = [
    [new Date(new Date().valueOf() - 1000), 1],
    [new Date(), 2]
  ];
  public dygLabels = ['Date', 'particulate_matter_typpartsize_um'];
  changeTrigger = 0;

  public sensorData = {};
  public sensorDataExample = {
    myBME: {
      temperature_degC: {
        index: {
          value: 25.5,
          tags: { id: '0x77' }
        }
      },

      pressure_hPA: {
        index: {
          value: 900,
          tags: { id: '0x77' }
        }
      },
      humidity_rel_percent: {
        index: {
          value: 42,
          tags: { id: '0x77' }
        }
      }
    }
  };

  graphstyle = {
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0'
  };

  public flow_conf = undefined;
  public flow_real = undefined;
  public flow_new = 1000;

  public temp_conf = -1;
  public temp_real = -42;
  public temp_new = 0;

  constructor(private globalSettings: GlobalSettingsService) {
    this.globalSettings.emitChange({ appName: 'MQTT-test' });
  }

  ngOnInit() {
    let server = this.globalSettings.server.serverName;
    console.log(server);

    this.client = new Paho.Client(server, 1885, this.clientID);
    this.client.onConnectionLost = this.onConnectionLost;
    this.client.onMessageArrived = this.onMessageArrived;
    document['MQTT_TEST'] = this.client;
    document['MQTT_TEST']['father'] = this;
    console.log('onInit', this.client);
    this.connect();

    // this.dygLabels = ;
  }
  ngOnDestroy() {
    this.stop();
  }
  stop() {
    this.client.unsubscribe(this.topic, {});
  }
  connect() {
    this.client.connect({
      onSuccess: this.onConnect,
      onFailure: this.onFailure
    });
    this.status = 'connecting';
  }
  onConnect() {
    console.log('onConnect');
    // console.log(this);
    const father = document['MQTT_TEST']['father'];
    document['MQTT_TEST'].subscribe(father.topic);
    father.status = 'connected';
  }

  setValves(newstatus) {
    this.client.publish(this.globalSettings.server.hostname + "/actuators/MAGVALVES",
      '{ "values":{"state":"' + newstatus + '"} }',
      0,
      true);
  }
  setFlow() {
    if (this.flow_new >= 0 && this.flow_new <= 1150) {
    this.client.publish(this.globalSettings.server.hostname + "/actuators/MFC",
      '{ "values":{"flow_scm":"' + this.flow_new + '"} }',
      0,
      true);
    } else {
      alert("flow must be between 0 and 1150 sccm")
    }
  }
  setTemp() {

  }

  onMessageArrived(message: Object) {
    const father = document['MQTT_TEST']['father'];

    const arr = message['topic'].split('/');
    if (arr.length < 2) { // e.g. topic "influx"
      console.log(message);
      return;
    }
    const sensor = arr[2];
    const metric = arr[3];

    console.log('got MQTT message from sensor ', sensor, ' about ', metric, message);
    try {
      const payload = JSON.parse(message['payloadString']);

      if (payload["values"]) {
        const values = payload["values"]
        if (values.hasOwnProperty("probe_degC")) {
          father.temp_real = values["probe_degC"];
        }
        if (values.hasOwnProperty("flow_sccm")) {
          father.flow_real = values["flow_sccm"];
        }

      }

      const value = payload['value'];
      let tags = JSON.parse(message['payloadString']);
      const TSString = tags['UTS'];
      delete tags['value'];
      delete tags['UTS'];
      const index = JSON.stringify(tags);

      // console.log(payload);
      if (!father.sensorData[sensor]) {
        father.sensorData[sensor] = {};
      }
      if (!father.sensorData[sensor][metric]) {
        father.sensorData[sensor][metric] = {};
      }
      father.sensorData[sensor][metric][index] = { value: value, tags: tags };

      let valueTimestamp = Number(TSString) * 1000;

      const sentDate =
        valueTimestamp > 0 ? new Date(valueTimestamp) : new Date();

      // father.dygData.push([sentDate, Number(value)]);
      // father.graph.updateGraph()
      father.changeTrigger += 1;
      // console.log(cloneDeep(father.dygData));

      if (message['retained']) {
        const msg = {
          date: sentDate,
          topic: message['topic'],
          payload: message['payloadString'],
          destinationName: message['destinationName'],
          qos: message['qos'],
        };
        father.retainedMqttMessages.unshift(msg);
      }

      if (father.updateMessages) {
        // console.log('msg:', message);
        const msg = {
          date: sentDate,
          topic: message['topic'],
          payload: message['payloadString'],
          destinationName: message['destinationName'],
          qos: message['qos'],
          retained: message['retained']
        };

        father.mqttMessages.unshift(msg);
        if (father.mqttMessages.length > father.maxlen) {
          father.mqttMessages.pop();
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  onFailure(message) {
    console.error('MQTT failure on connect');
    console.error(message);
    document['MQTT_TEST']['father'].status = 'failed';
  }
  onConnectionLost(responseObject) {
    const father = document['MQTT_TEST']['father'];
    console.error('onConnectionLost object: ', responseObject);
    if (responseObject.errorCode !== 0) {
      console.error('onConnectionLost:', responseObject.errorMessage);
    }
    father.status = 'lost';
    father.disconnects += 1;
    father.connect();
  }
}
