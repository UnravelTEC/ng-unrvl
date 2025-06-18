import { Component, OnInit, OnDestroy } from '@angular/core';
import { GlobalSettingsService } from '../../core/global-settings.service';
import * as Paho from 'paho-mqtt';
import { UtFetchdataService } from 'app/shared/ut-fetchdata.service';
import { LocalStorageService } from 'app/core/local-storage.service';
import { cloneDeep } from 'lodash-es';

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
    'nano4e-gen2/actuators/DAC/AFEBOARD1/MEAS/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD1/LED/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD1/HEAT/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD2/MEAS/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD2/LED/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD2/HEAT/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD3/MEAS/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD3/LED/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD3/HEAT/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD4/MEAS/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD4/LED/settings',
    'nano4e-gen2/actuators/DAC/AFEBOARD4/HEAT/settings',
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

  public DACstatus = { "AFEBOARD1": { "LED": { "ch1_V": undefined } } }
  public channels = ["ch1_V", "ch2_V", "ch3_V", "ch4_V"];
  public channelNames = { "ch1_V": "Channel 1", "ch2_V": "Channel 2", "ch3_V": "Channel 3", "ch4_V": "Channel 4" }
  public DACnewValues = {}
  public DACnewValuesSent = {}

  public temp_conf = -1;
  public temp_real = -42;
  public temp_new = 0;

  public pins = {
    'DIGITBOARD': { 'MICS_HEATER': 0b0001, '3V3_SUPPLY': 0b0010, '5V_SUPPLY': 0b0100, 'SCD30_SUPPLY': 0b1000 },
    "AFEBOARD1": { "LED11": 0b1, "LED12": 0b10, "LED21": 0b100, "LED22": 0b1000, "LED31": 0b10000, "LED32": 0b100000, "LED4": 0b1000000, "HEATER": 0b10000000 },
    "AFEBOARD2": { "LED11": 0b1, "LED12": 0b10, "LED21": 0b100, "LED22": 0b1000, "LED31": 0b10000, "LED32": 0b100000, "LED4": 0b1000000, "HEATER": 0b10000000 },
    "AFEBOARD3": { "LED11": 0b1, "LED12": 0b10, "LED21": 0b100, "LED22": 0b1000, "LED31": 0b10000, "LED32": 0b100000, "LED4": 0b1000000, "HEATER": 0b10000000 },
    "AFEBOARD4": { "LED11": 0b1, "LED12": 0b10, "LED21": 0b100, "LED22": 0b1000, "LED31": 0b10000, "LED32": 0b100000, "LED4": 0b1000000, "HEATER": 0b10000000 },
  };
  public gpios = { 'DIGITBOARD': { 'MICS_HEATER': undefined, '3V3_SUPPLY': undefined, '5V_SUPPLY': undefined, 'SCD30_SUPPLY': undefined } };
  public pinNames = { 'MICS_HEATER': 'MICS6814 Heater', '3V3_SUPPLY': '3V3 switched power supply', '5V_SUPPLY': '5V switched power supply', 'SCD30_SUPPLY': 'SCD30 CO2 sensor switched power supply' }
  public valve_reason = "";

  public services = []; // only gets filled with 1 entry
  public loadingText = 'Initializing...';
  public fanspeed = 0;

  private ls_api_user;
  private ls_api_pass;

  public debugmqtt: boolean = false;

  constructor(private gss: GlobalSettingsService, private utHTTP: UtFetchdataService, private localStorage: LocalStorageService,) {
    this.gss.emitChange({ appName: 'Nano4E-Gen2 Control' });

    const DACtypes = ["MEAS", "LED", "HEAT"]
    for (let i = 1; i <= 4; i++) {
      const board = "AFEBOARD" + String(i)
      this.DACstatus[board] = {}
      DACtypes.forEach(DACname => {
        this.DACstatus[board][DACname] = {}
        this.channels.forEach(channel => {
          this.DACstatus[board][DACname][channel] = NaN
        });
      });
    }
    this.DACnewValues = cloneDeep(this.DACstatus)
    this.DACnewValuesSent = cloneDeep(this.DACstatus)

    for (const boardname in this.pins) {
      if (Object.prototype.hasOwnProperty.call(this.pins, boardname)) {
        const board = this.pins[boardname];
        this.gpios[boardname] = {}
        for (const pinkey in board) {
          if (Object.prototype.hasOwnProperty.call(board, pinkey)) {
            this.gpios[boardname][pinkey] = undefined
          }
        }
      }
    }

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

  public animateOnClickShow = false;
  setDAC() {
    for (const AFEBOARDid in this.DACnewValuesSent) {
      if (Object.prototype.hasOwnProperty.call(this.DACnewValuesSent, AFEBOARDid)) {
        const AFEBOARD = this.DACnewValuesSent[AFEBOARDid];
        for (const DACid in AFEBOARD) {
          if (Object.prototype.hasOwnProperty.call(AFEBOARD, DACid)) {
            const DAC = AFEBOARD[DACid];
            for (const channel in DAC) {
              if (Object.prototype.hasOwnProperty.call(DAC, channel)) {
                DAC[channel] = NaN
              }
            }
          }
        }
      }
    }
    for (const AFEBOARDid in this.DACnewValues) {
      if (Object.prototype.hasOwnProperty.call(this.DACnewValues, AFEBOARDid)) {
        const AFEBOARD = this.DACnewValues[AFEBOARDid];
        for (const DACid in AFEBOARD) {
          if (Object.prototype.hasOwnProperty.call(AFEBOARD, DACid)) {
            const DAC = AFEBOARD[DACid];
            let values = {}
            for (const channel in DAC) {
              if (Object.prototype.hasOwnProperty.call(DAC, channel)) {
                const value = DAC[channel];
                if (!isNaN(value) && value !== undefined && value !== null) {
                  values[channel] = value;
                }
              }
            }
            if (Object.keys(values).length > 0) {
              const payload = { "values": values, "UTS": new Date().valueOf() / 1000 }
              this.client.publish(this.gss.server.hostname + "/actuators/DAC/" + AFEBOARDid + "/" + DACid + "/set",
                JSON.stringify(payload),
                0,
                true);
              console.log(payload);
              for (const channel in values) {
                if (Object.prototype.hasOwnProperty.call(values, channel)) {
                  const value = values[channel];
                  this.DACnewValuesSent[AFEBOARDid][DACid][channel] = value
                }
              }

            }
          }
        }
      }
      this.animateOnClickShow = true;
      setTimeout(() => {
        this.animateOnClickShow = false;
      }, 2000);
    }
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
    const type = arr[1];
    const actor = arr[2];
    const metric = arr[arr.length - 1];

    if (type == "sensor")
      console.log('got MQTT message from sensor', actor, 'about', metric, message);
    if (type == "actuator")
      console.log('got MQTT message from t', actor, 'about', metric, message);

    try {
      const payload = JSON.parse(message['payloadString']);

      if (payload["values"]) {
        const values = payload["values"]
        switch (metric) {
          case "temperature":
            father.temp_real = values["probe_degC"];
            break;
          case "settings":
            if (values.hasOwnProperty("reg")) {
              const board = arr[arr.length - 2];
              const value = values['reg'];
              for (const pinname in father.pins[board]) {
                if (Object.prototype.hasOwnProperty.call(father.pins[board], pinname)) {
                  const hexmask = father.pins[board][pinname];
                  father.gpios[board][pinname] = (!Boolean(hexmask & value)) ? "on" : "off"
                }
              }

            }

            if (actor == "DAC") {
              father.channels.forEach(channel => {
                if (values.hasOwnProperty(channel)) {
                  father.DACstatus[arr[3]][arr[4]][channel] = values[channel]
                }
              });
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
      if (!father.sensorData[actor]) {
        father.sensorData[actor] = {};
      }
      if (!father.sensorData[actor][metric]) {
        father.sensorData[actor][metric] = {};
      }
      father.sensorData[actor][metric][index] = { value: value, tags: tags };

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
