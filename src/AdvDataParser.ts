// NOTE:
// https://www.bluetooth.com/specifications/assigned-numbers/generic-access-profile/

import { LeExtAdvReport } from "./HciLeController";

export interface AdvDataField {
  type: number;
  data: Buffer;
}

export enum AdvDataType {
  Flags                                   = 0x01, // *
  IncompleteListOf16bitServiceClassUuids  = 0x02, // *
  CompleteListOf16bitServiceClassUuids    = 0x03, // *
  IncompleteListOf32bitServiceClassUuids  = 0x04, // *
  CompleteListOf32bitServiceClassUuids    = 0x05, // *
  IncompleteListOf128bitServiceClassUuids = 0x06, // *
  CompleteListOf128bitServiceClassUuids   = 0x07, // *
  ShortenedLocalName                      = 0x08, // *
  CompleteLocalName                       = 0x09, // *
  TxPowerLevel                            = 0x0A, // *
  ClassOfDevice                           = 0x0D,
  SimplePairingHashC                      = 0x0E,
  SimplePairingHashC192                   = 0x0E,
  SimplePairingRandomizerR                = 0x0F,
  SimplePairingRandomizerR192             = 0x0F,
  DeviceId                                = 0x10,
  SecurityManagerTkValue                  = 0x10,
  SecurityManagerOobFlags                 = 0x11,
  SlaveConnectionIntervalRange            = 0x12,
  ListOf16bitServiceSolicitationUuids     = 0x14, // *
  ListOf128bitServiceSolicitationUuids    = 0x15, // *
  ServiceData                             = 0x16, // *
  ServiceData16bitUuid                    = 0x16, // *
  PublicTargetAddress                     = 0x17,
  RandomTargetAddress                     = 0x18,
  Appearance                              = 0x19,
  AdvertisingInterval                     = 0x1A,
  LeBluetoothDeviceAddress                = 0x1B,
  LeRole                                  = 0x1C,
  SimplePairingHashC256                   = 0x1D,
  SimplePairingRandomizerR256             = 0x1E,
  ListOf32bitServiceSolicitationUuids     = 0x1F, // *
  ServiceData32bitUuid                    = 0x20, // *
  ServiceData128bitUuid                   = 0x21, // *
  LeSecureConnectionsConfirmationValue    = 0x22,
  LeSecureConnectionsRandomValue          = 0x23,
  Uri                                     = 0x24,
  IndoorPositioning                       = 0x25,
  TransportDiscoveryData                  = 0x26,
  LeSupportedFeatures                     = 0x27,
  ChannelMapUpdateIndication              = 0x28,
  PbAdv                                   = 0x29,
  MeshMessage                             = 0x2A,
  MeshBeacon                              = 0x2B,
  BigInfo                                 = 0x2C,
  BroadcastCode                           = 0x2D,
  InformationData3d                       = 0x3D,
  ManufacturerSpecificData                = 0xFF, // *
}

export const AdvDataTypeLabel = [
  'Flags',
  'Incomplete List of 16-bit Service Class UUIDs',
  'Complete List of 16-bit Service Class UUIDs',
  'Incomplete List of 32-bit Service Class UUIDs',
  'Complete List of 32-bit Service Class UUIDs',
  'Incomplete List of 128-bit Service Class UUIDs',
  'Complete List of 128-bit Service Class UUIDs',
  'Shortened Local Name',
  'Complete Local Name',
  'Tx Power Level',
  'Class of Device',
  'Simple Pairing Hash C',
  'Simple Pairing Hash C-192',
  'Simple Pairing Randomizer R',
  'Simple Pairing Randomizer R-192',
  'Device ID',
  'Security Manager TK Value',
  'Security Manager Out of Band Flags',
  'Slave Connection Interval Range',
  'List of 16-bit Service Solicitation UUIDs',
  'List of 128-bit Service Solicitation UUIDs',
  'Service Data',
  'Service Data - 16-bit UUID',
  'Public Target Address',
  'Random Target Address',
  'Appearance',
  'Advertising Interval',
  'LE Bluetooth Device Address',
  'LE Role',
  'Simple Pairing Hash C-256',
  'Simple Pairing Randomizer R-256',
  'List of 32-bit Service Solicitation UUIDs',
  'Service Data - 32-bit UUID',
  'Service Data - 128-bit UUID',
  'LE Secure Connections Confirmation Value',
  'LE Secure Connections Random Value',
  'URI',
  'Indoor Positioning',
  'Transport Discovery Data',
  'LE Supported Features',
  'Channel Map Update Indication',
  'PB-ADV',
  'Mesh Message',
  'Mesh Beacon',
  'BIGInfo',
  'Broadcast_Code',
  '3D Information Data',
  'Manufacturer Specific Data',
];

export interface AdvData {
  flags?: number;
  serviceUuids?: string[];
  serviceSolicitationUuids?: string[];
  localName?: string;
  shortenedLocalName?: string;
  completeLocalName?: string;
  txPowerLevel?: number;
  manufacturerData?: {
    ident: number;
    data: Buffer;
  };
  serviceData?: {
    uuid: string;
    data: Buffer;
  }[];
}

export class AdvDataParser {
  static parse(advReport: LeExtAdvReport): AdvData {
    const ad: AdvData = {};

    const adBuffer = advReport.data;
    if (!adBuffer) {
      return ad;
    }

    const fields: AdvDataField[] = [];

    let o = 0;
    while (o < adBuffer.length) {
      const len = adBuffer[o++];

      if (len === 0 || o >= adBuffer.length) {
        continue;
      }

      const type = adBuffer[o++];
      const data = adBuffer.slice(o, o + (len - 1));

      o += len - 1;

      fields.push({ type, data });
    }

    for (const field of fields) {
      this.parseField(ad, field);
    }

    return ad;
  }

  private static parseField(advData: AdvData, field: { type: number, data: Buffer }): void {
    switch (field.type) {
      case AdvDataType.Flags:
        advData.flags = field.data[0];
        break;

      case AdvDataType.IncompleteListOf16bitServiceClassUuids:
      case AdvDataType.CompleteListOf16bitServiceClassUuids:
        for (let j = 0; j < field.data.length; j += 2) {
          const uuid = field.data.slice(j, j + 2).reverse().toString('hex');

          advData.serviceUuids = advData.serviceUuids ?? [];
          if (advData.serviceUuids.indexOf(uuid) === -1) {
            advData.serviceUuids.push(uuid);
          }
        }
        break;

      case AdvDataType.IncompleteListOf32bitServiceClassUuids:
      case AdvDataType.CompleteListOf32bitServiceClassUuids:
        for (let j = 0; j < field.data.length; j += 4) {
          const uuid = field.data.slice(j, j + 4).reverse().toString('hex');

          advData.serviceUuids = advData.serviceUuids ?? [];
          if (advData.serviceUuids.indexOf(uuid) === -1) {
            advData.serviceUuids.push(uuid);
          }
        }
        break;
    
      case AdvDataType.IncompleteListOf128bitServiceClassUuids:
      case AdvDataType.CompleteListOf128bitServiceClassUuids:
        for (let j = 0; j < field.data.length; j += 16) {
          const uuid = field.data.slice(j, j + 16).reverse().toString('hex');
          if (!uuid) {
            continue;
          }

          advData.serviceUuids = advData.serviceUuids ?? [];
          if (advData.serviceUuids.indexOf(uuid) === -1) {
            advData.serviceUuids.push(uuid);
          }
        }
        break;

      case AdvDataType.ShortenedLocalName:
        advData.shortenedLocalName = field.data.toString('utf8');
        if (!advData.localName) {
          advData.localName = advData.shortenedLocalName;
        }
        break;
      case AdvDataType.CompleteLocalName:
        advData.completeLocalName = field.data.toString('utf8');
        advData.localName = advData.completeLocalName;
        break;

      case AdvDataType.TxPowerLevel:
        advData.txPowerLevel = field.data.readInt8(0);
        break;

      case AdvDataType.ListOf16bitServiceSolicitationUuids:
        for (let j = 0; j < field.data.length; j += 2) {
          const uuid = field.data.slice(j, j + 2).reverse().toString('hex');

          advData.serviceSolicitationUuids = advData.serviceSolicitationUuids ?? [];
          if (advData.serviceSolicitationUuids.indexOf(uuid) === -1) {
            advData.serviceSolicitationUuids.push(uuid);
          }
        }
        break;
      case AdvDataType.ListOf32bitServiceSolicitationUuids:
        for (let j = 0; j < field.data.length; j += 4) {
          const uuid = field.data.slice(j, j + 4).reverse().toString('hex');

          advData.serviceSolicitationUuids = advData.serviceSolicitationUuids ?? [];
          if (advData.serviceSolicitationUuids.indexOf(uuid) === -1) {
            advData.serviceSolicitationUuids.push(uuid);
          }
        }
        break;
      case AdvDataType.ListOf128bitServiceSolicitationUuids:
        for (let j = 0; j < field.data.length; j += 16) {
          const uuid = field.data.slice(j, j + 16).reverse().toString('hex');

          advData.serviceSolicitationUuids = advData.serviceSolicitationUuids ?? [];
          if (advData.serviceSolicitationUuids.indexOf(uuid) === -1) {
            advData.serviceSolicitationUuids.push(uuid);
          }
        }
        break;

      case AdvDataType.ServiceData16bitUuid:
        advData.serviceData = advData.serviceData ?? [];
        advData.serviceData.push({
          uuid: field.data.slice(0, 2).reverse().toString('hex'),
          data: field.data.slice(2, field.data.length),
        });
        break;
      case AdvDataType.ServiceData32bitUuid:
        advData.serviceData = advData.serviceData ?? [];
        advData.serviceData.push({
          uuid: field.data.slice(0, 4).reverse().toString('hex'),
          data: field.data.slice(4, field.data.length),
        });
        break;
      case AdvDataType.ServiceData128bitUuid:
        advData.serviceData = advData.serviceData ?? [];
        advData.serviceData.push({
          uuid: field.data.slice(0, 16).reverse().toString('hex'),
          data: field.data.slice(16, field.data.length),
        });
        break;

      case AdvDataType.ManufacturerSpecificData:
        advData.manufacturerData = {
          ident: field.data.readUInt16LE(0),
          data:  field.data.slice(2),
        };
        break;
    }
  }
}