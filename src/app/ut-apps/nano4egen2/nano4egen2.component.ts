import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import * as Paho from 'paho-mqtt';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { LocalStorageService } from 'app/core/local-storage.service';

// import cloneDeep from 'lodash-es/cloneDeep';

@Component({
  selector: 'app-nano4egen2',
  templateUrl: './nano4egen2.component.html',
  styleUrls: ['./nano4egen2.component.scss']
})
export class Nano4EGen2Component implements OnInit, OnDestroy {
  status = 'init'; // | connecting | connected | failed | lost
  public disconnects = 0;
  private client;
  private clientID = 'clientID_' + String(Math.random() * 100);
  // public topic = '+/sensors/SPS30/particulate_matter_typpartsize_um';

  public topic = '#';
  public topics = [
    'nano4e-gen2/actuators/GPIOEXP/DIGITBOARD/settings',
    'nano4e-gen2/actuators/GPIOEXP/AFEBOARD1/settings',
    'nano4e-gen2/actuators/GPIOEXP/AFEBOARD2/settings',
    'nano4e-gen2/actuators/GPIOEXP/AFEBOARD3/settings',
    'nano4e-gen2/actuators/GPIOEXP/AFEBOARD4/settings',
    'nano4e-gen2/actuators/HEATER/1/settings',
    'nano4e-gen2/actuators/MFC/settings',
    'nano4e-gen2/actuators/MFC/airflow',
    'nano4e-gen2/sensors/MCP9600/temperature',
    'nano4e-gen2/sensors/FANSPEED/fanspeed',
  ]

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

  public pins = { 'DIGITBOARD': { 'MICS_HEATER': 0b0001, '3V3_SUPPLY': 0b0010, '5V_SUPPLY': 0b0100, 'SCD30_SUPPLY': 0b1000 } };
  public gpios = { 'DIGITBOARD': { 'MICS_HEATER': undefined, '3V3_SUPPLY': undefined, '5V_SUPPLY': undefined, 'SCD30_SUPPLY': undefined } };
  public valve_reason = "";

  public services = []; // only gets filled with 1 entry
  public loadingText = 'Initializing...';
  public fanspeed = 0;

  private ls_api_user;
  private ls_api_pass;

  public debugmqtt: boolean = false;

  constructor(private gss: GlobalSettingsService, private utHTTP: UtFetchdataService, private localStorage: LocalStorageService,) {
    this.gss.emitChange({ appName: 'Nano4E-Gen2 Control' });
  }

  ngOnInit() {
    let server = this.gss.server.serverName;
    console.log(server);

    this.client = new Paho.Client(server, 1885, this.clientID);
    this.client.onConnectionLost = this.onConnectionLost;
    this.client.onMessageArrived = this.onMessageArrived;
    document['MQTT_CLIENT'] = this.client;
    document['MQTT_CLIENT']['father'] = this;
    console.log('onInit', this.client);
    this.connect();

    this.ls_api_user = this.localStorage.get('api_user');
    this.ls_api_pass = this.localStorage.get('api_pass');
    // this.getService();

    // this.dygLabels = ;
  }
  ngOnDestroy() {
    this.stop();
  }

  toggleDebug() {
    this.debugmqtt = !this.debugmqtt;
  }

  stop() {
    for (let i = 0; i < this.topics.length; i++) {
      this.client.unsubscribe(this.topics[i], {});
    }
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
    const father = document['MQTT_CLIENT']['father'];
    for (let i = 0; i < father.topics.length; i++) {
      document['MQTT_CLIENT'].subscribe(father.topics[i]);
    }

    father.status = 'connected';
  }

  setGPIO(expander, pin: string, newstatus) {
    const values = {}
    values[pin] = newstatus
    this.client.publish(this.gss.server.hostname + "/actuators/GPIOEXP/" + expander + "/set",
      JSON.stringify({ "values": values, "UTS": new Date().valueOf() / 1000 }),
      0,
      true);
  }
  setFlow() {
    if (this.flow_new >= 0 && this.flow_new <= 1150) {
      this.client.publish(this.gss.server.hostname + "/actuators/MFC/set",
        JSON.stringify({ "values": { "flow_sccm": this.flow_new }, "UTS": new Date().valueOf() / 1000 }),
        0,
        true);
    } else {
      alert("flow must be between 0 and 1150 sccm")
    }
  }
  setTemp() {
    this.client.publish(this.gss.server.hostname + "/actuators/HEATER/1/set",
      JSON.stringify({ "values": { "target_degC": this.temp_new }, "UTS": new Date().valueOf() / 1000 }),
      0,
      true);
  }

  onMessageArrived(message: Object) {
    const father = document['MQTT_CLIENT']['father'];

    const arr = message['topic'].split('/');
    if (arr.length < 2) { // e.g. topic "influx"
      console.log(message);
      return;
    }
    const sensor = arr[2];
    const metric = arr[arr.length - 1];

    console.log('got MQTT message from sensor', sensor, 'about', metric, message);
    try {
      const payload = JSON.parse(message['payloadString']);

      if (payload["values"]) {
        const values = payload["values"]
        switch (metric) {
          case "temperature":
            father.temp_real = values["probe_degC"];
            break;
          case "fanspeed":
            father.fanspeed = values["fanspeed_rpm"];
            break;
          case "airflow":
            father.flow_real = values["flow_sccm"];
            break;
          case "settings":
            if (values.hasOwnProperty("reg")) {
              const board = arr[arr.length - 2];
              const value = values['reg'];
              for (const pinname in father.pins[board]) {
                if (Object.prototype.hasOwnProperty.call(father.pins[board], pinname)) {
                  const hexmask = father.pins[board][pinname];
                  father.gpios[board][pinname] = !Boolean(hexmask & value)
                }
              }

            }
            if (values.hasOwnProperty("state")) {
              father.valve_state = values["state"];
              father.valve_reason = values["reason"];
            }
            if (values.hasOwnProperty("flow_sccm")) {
              father.flow_conf = values["flow_sccm"];
            }
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
    document['MQTT_CLIENT']['father'].status = 'failed';
  }
  onConnectionLost(responseObject) {
    const father = document['MQTT_CLIENT']['father'];
    console.error('onConnectionLost object: ', responseObject);
    if (responseObject.errorCode !== 0) {
      console.error('onConnectionLost:', responseObject.errorMessage);
    }
    father.status = 'lost';
    father.disconnects += 1;
    father.connect();
  }

  // copied & modified from services.component TODO split into ng service
  getService() {
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() + 'system/services.php?service=gpiofancontrol'
      )
      .subscribe(
        (data: Object) => this.acceptService(data),
        (error) => this.gss.displayHTTPerror(error)
      );
    this.loadingText = 'Loading...';
  }
  acceptService(data: Object) {
    console.log('services:', data);
    if (data && data['services']) {
      this.services = data['services'];
      this.loadingText = '';
    } else {
      this.loadingText = 'Error, no fancontrol service.';
    }
  }

  // copied from services.component TODO split into ng service
  startService(service: string) {
    console.log('starting', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['running'] = undefined;
      }
    });
    this.sendCmd(service, 'start');
  }
  stopService(service: string) {
    console.log('stopping', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['running'] = undefined;
      }
    });
    this.sendCmd(service, 'stop');
  }
  enableService(service: string) {
    console.log('enabling', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['onboot'] = undefined;
      }
    });
    this.sendCmd(service, 'enable');
  }
  disableService(service: string) {
    console.log('disabling', service);
    this.services.forEach((serviceItem) => {
      if (serviceItem['name'] == service) {
        serviceItem['onboot'] = undefined;
      }
    });
    this.sendCmd(service, 'disable');
  }

  sendCmd(service: String, cmd: String) {
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() +
        'system/service.php?cmd=' +
        cmd +
        '&service=' +
        service,
        this.ls_api_user,
        this.ls_api_pass,
        true
      )
      .subscribe(
        (data: Object) => this.checkSuccessOfCommand(data),
        (error) => this.gss.displayHTTPerror(error)
      );
  }
  checkSuccessOfCommand(data: Object) {
    console.log('success:', data);
    if (!data['success']) {
      alert('last command unsuccessful');
    } else {
      this.getService();
    }
  }
}
