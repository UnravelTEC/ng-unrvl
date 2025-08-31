import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import * as Paho from 'paho-mqtt';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { LocalStorageService } from 'app/core/local-storage.service';

// import cloneDeep from 'lodash-es/cloneDeep';

@Component({
  selector: 'app-gastestbench',
  templateUrl: './gastestbench.component.html',
  styleUrls: ['./gastestbench.component.scss']
})
export class GastestbenchComponent implements OnInit, OnDestroy {
  status = 'init'; // | connecting | connected | failed | lost
  public disconnects = 0;
  private client;
  private clientID = 'clientID_' + String(Math.random() * 100);
  // public topic = '+/sensors/SPS30/particulate_matter_typpartsize_um';

  public topic = '#';
  public topics = [
    '/actuators/MAGVALVES/settings',
    '/actuators/HEATER/1/settings',
    '/actuators/rhcontrol/evap/settings',
    '/actuators/rhcontrol/flush/settings',
    '/actuators/MFC/evap-dry/set',
    '/actuators/MFC/evap-wet/set',
    '/actuators/MFC/flush-dry/set',
    '/actuators/MFC/flush-wet/set',
    '/sensors/SFC6000/airflow',
    '/sensors/MCP9600/temperature',
    '/sensors/BME280/humidity',
    '/sensors/SCD30/humidity',
    '/sensors/FANSPEED/fanspeed',
  ];

  // STATUS check
  // humidity OK (innerhalb x %)
  // Flow OK (innerhalb x %)
  // T OK

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

  public flow_flush_target = undefined;
  public flow_flush_wet_target = undefined
  public flow_flush_dry_target = undefined
  public flow_evap_target = undefined;
  public flow_evap_wet_target = undefined;
  public flow_evap_dry_target = undefined;

  public flow_flush_real = undefined;
  public flow_flush_wet_real = undefined;
  public flow_flush_dry_real = undefined;
  public flow_evap_real = undefined;
  public flow_evap_wet_real = undefined;
  public flow_evap_dry_real = undefined;

  public flow_flush_new = 1;
  public flow_evap_new = 1;

  public hum_flush_target = undefined
  public hum_evap_target = undefined;
  public hum_flush_real = undefined;
  public hum_evap_real = undefined;
  public hum_flush_new = 50;
  public hum_evap_new = 50;

  public anEvapSet = false
  public anEvapStart = false
  public anEvapStop = false
  public anEvapRHStart = false
  public anEvapRHStop = false
  public anFlushSet = false
  public anFlushStart = false
  public anFlushStop = false

  public anFanStart = false
  public anFanStop = false
  public anHeatSet = false

  public temp_conf = -1;
  public temp_real = -42;
  public temp_new = 0;

  public valve_state = "";
  public valve_reason = "";

  public evap_rh_sensor = "BME280"
  public flush_rh_sensor = "SCD30"

  public services = {};
  public loadingText = 'Initializing...';
  public fanspeed = 0;

  private ls_api_user;
  private ls_api_pass;

  public debugmqtt: boolean = false;

  constructor(private gss: GlobalSettingsService, private utHTTP: UtFetchdataService, private localStorage: LocalStorageService,) {
    this.gss.emitChange({ appName: 'Gastestbench Control' });
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
    this.getService('gpiofancontrol');
    this.getService('sfc6000-evap-wetair');
    this.getService('sfc6000-evap-dryair');
    this.getService('sfc6000-flush-wetair');
    this.getService('sfc6000-flush-dryair');
    this.getService('rhcontrol-evap');
    this.getService('rhcontrol-flush');

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
      this.client.unsubscribe(this.gss.server.hostname + this.topics[i], {});
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
    console.log('mqtt Gastestbench: subscribing to', father.gss.server.hostname, father.topics);
    for (let i = 0; i < father.topics.length; i++) {
      document['MQTT_CLIENT'].subscribe(father.gss.server.hostname + father.topics[i]);
    }

    father.status = 'connected';
  }

  anClk(item) {
    this[item] = true;
    setTimeout(() => { this[item] = false; }, 500);
  }

  setValves(newstatus) {
    this.client.publish(this.gss.server.hostname + "/actuators/MAGVALVES/set",
      JSON.stringify({ "values": { "state": newstatus }, "UTS": new Date().valueOf() / 1000 }),
      0,
      true);
  }
  setFlush() {
    if (this.flow_flush_new >= 0 && this.flow_flush_new <= 5 && this.hum_flush_new >= 0 && this.hum_flush_new <= 100) {
      const payload = { "values": { "target_flow_slm": this.flow_flush_new, "target_rH": this.hum_flush_new }, "UTS": new Date().valueOf() / 1000 }
      console.log(this.gss.server.hostname + "/actuators/rhcontrol/flush/set", payload);
      this.client.publish(this.gss.server.hostname + "/actuators/rhcontrol/flush/set", JSON.stringify(payload), 0, true);
    } else {
      alert("flush flow must be between 0 and 5 slm, rH between 0 and 100 %")
    }
    this.anFlushSet = true
    setTimeout(() => { this.anFlushSet = false; }, 500);
  }
  setEvap() {
    if (this.flow_evap_new >= 0 && this.flow_evap_new <= 5 && this.hum_evap_new >= 0 && this.hum_evap_new <= 100) {
      const payload = { "values": { "target_flow_slm": this.flow_evap_new, "target_rH": this.hum_evap_new }, "UTS": new Date().valueOf() / 1000 }
      console.log(this.gss.server.hostname + "/actuators/rhcontrol/evap/set", payload);
      this.client.publish(this.gss.server.hostname + "/actuators/rhcontrol/evap/set", JSON.stringify(payload), 0, true);
    } else {
      alert("evap flow must be between 0 and 5 slm, rH between 0 and 100 %")
    }
    this.anEvapSet = true
    setTimeout(() => { this.anEvapSet = false; }, 500);
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
    if (arr.length < 2 && father.debugmqtt) { // e.g. topic "influx"
      console.log(message);
      return;
    }
    const sensor = arr[2];
    const metric = arr[arr.length - 1];

    if (father.debugmqtt) {
      console.log('got MQTT message from sensor', sensor, 'about', metric, message);
    }

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
            const tags = payload['tags']
            if (tags["target"] == "flush-wet")
              father.flow_flush_wet_real = values["flow_slm"];
            if (tags["target"] == "flush-dry")
              father.flow_flush_dry_real = values["flow_slm"];
            if (tags["target"] == "evap-wet")
              father.flow_evap_wet_real = values["flow_slm"];
            if (tags["target"] == "evap-dry")
              father.flow_evap_dry_real = values["flow_slm"];
            break;
          case "humidity":
            if (sensor == father.evap_rh_sensor) {
              father.hum_evap_real = values["H2O_rel_percent"]
            }
            if (sensor == father.flush_rh_sensor) {
              father.hum_flush_real = values["H2O_rel_percent"]
            }
            break;
          case "settings":
            if (values.hasOwnProperty("target_degC")) {
              father.temp_conf = values["target_degC"];
            }
            if (values.hasOwnProperty("state")) {
              father.valve_state = values["state"];
              father.valve_reason = values["reason"];
            }
            if (values.hasOwnProperty("target_flow_slm")) {
              const path = arr[arr.length - 2];
              if (path == "flush") {
                father.flow_flush_target = values["target_flow_slm"]
                father.hum_flush_target = values["target_rH"]
              }
              if (path == "evap") {
                father.flow_evap_target = values["target_flow_slm"]
                father.hum_evap_target = values["target_rH"]
              }
            }
            break;
          case "set":
            if (arr[arr.length - 3] == "MFC") {
              const mfc = arr[arr.length - 2]
              if (mfc == "evap-dry")
                father.flow_evap_dry_target = values["flow_slm"];
              if (mfc == "evap-wet")
                father.flow_evap_wet_target = values["flow_slm"];
              if (mfc == "flush-dry")
                father.flow_flush_dry_target = values["flow_slm"];
              if (mfc == "flush-wet")
                father.flow_flush_wet_target = values["flow_slm"];
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
  getService(service) {
    this.utHTTP
      .getHTTPData(
        this.gss.getAPIEndpoint() + 'system/services.php?service=' + service
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
      const item = data['services'][0]
      this.services[item['name']] = item['running']
      console.log(this.services);
      this.loadingText = '';
    } else {
      this.loadingText = 'Error, no service returned.';
    }
  }

  actionPath(path, action) {
    console.log('action:', path, action);
    // this.sendCmd('rhcontrol-' + path, action);
    this.sendCmd('sfc6000-' + path + '-dryair', action);
    this.sendCmd('sfc6000-' + path + '-wetair', action);
  }

  // copied from services.component TODO split into ng service
  startService(service: string) {
    console.log('starting', service);
    // this.services.forEach((serviceItem) => {
    //   if (serviceItem['name'] == service) {
    //     serviceItem['running'] = undefined;
    //   }
    // });
    this.sendCmd(service, 'start');
  }
  stopService(service: string) {
    console.log('stopping', service);
    // this.services.forEach((serviceItem) => {
    //   if (serviceItem['name'] == service) {
    //     serviceItem['running'] = undefined;
    //   }
    // });
    this.sendCmd(service, 'stop');
  }
  // enableService(service: string) {
  //   console.log('enabling', service);
  //   this.services.forEach((serviceItem) => {
  //     if (serviceItem['name'] == service) {
  //       serviceItem['onboot'] = undefined;
  //     }
  //   });
  //   this.sendCmd(service, 'enable');
  // }
  // disableService(service: string) {
  //   console.log('disabling', service);
  //   this.services.forEach((serviceItem) => {
  //     if (serviceItem['name'] == service) {
  //       serviceItem['onboot'] = undefined;
  //     }
  //   });
  //   this.sendCmd(service, 'disable');
  // }

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
      this.getService(data['service']);
    }
  }
}

