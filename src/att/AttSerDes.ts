import { AttOpcode } from './AttOpcode';
import { AttErrorCode } from './AttError';

export interface AttErrorRspMsg {
  requestOpcodeInError:   number;       // s:1, The request that generated this ATT_ERROR_RSP PDU
  attributeHandleInError: number;       // s:2, The attribute handle that generated this ATT_ERROR_RSP PDU
  errorCode:              AttErrorCode; // s:1, The reason why the request has generated an ATT_ERROR_RSP PDU
}

export class AttErrorRsp {
  private static readonly size = 5;

  static serialize(data: AttErrorRspMsg): Buffer {
    const buffer = Buffer.allocUnsafe(this.size);
    let o = 0;
    o = buffer.writeUIntLE(AttOpcode.ErrorRsp,          o, 1);
    o = buffer.writeUIntLE(data.requestOpcodeInError,   o, 1);
    o = buffer.writeUIntLE(data.attributeHandleInError, o, 2);
    o = buffer.writeUIntLE(data.errorCode,              o, 1);
    return buffer;
  }

  static deserialize(buffer: Buffer): AttErrorRspMsg|null {
    if (buffer.readUInt8(0) !== AttOpcode.ErrorRsp ||
        buffer.length       !== this.size) {
      return null;
    }
    return {
       requestOpcodeInError:   buffer.readUIntLE(0, 1),
       attributeHandleInError: buffer.readUIntLE(1, 2),
       errorCode:              buffer.readUIntLE(3, 1),
    };
  }
}

export interface AttExchangeMtuReqMsg {
  mtu: number;
}

export class AttExchangeMtuReq {
  private static readonly size = 3;

  static serialize(req: AttExchangeMtuReqMsg): Buffer {
    const buffer = Buffer.allocUnsafe(this.size);
    let o = 0;
    o = buffer.writeUIntLE(AttOpcode.ExchangeMtuReq, o, 1);
    o = buffer.writeUIntLE(req.mtu,                  o, 2);
    return buffer;
  }

  static deserialize(buffer: Buffer): AttExchangeMtuReqMsg|null {
    if (buffer.readUInt8(0) !== AttOpcode.ExchangeMtuReq ||
        buffer.length       !== this.size) {
      return null;
    }
    return { mtu: buffer.readUIntLE(1, 2) };
  }
}

export interface AttExchangeMtuRspMsg {
  mtu: number;
}

export class AttExchangeMtuRsp {
  private static readonly size = 3;

  static serialize(req: AttExchangeMtuRspMsg): Buffer {
    const buffer = Buffer.allocUnsafe(this.size);
    let o = 0;
    o = buffer.writeUIntLE(AttOpcode.ExchangeMtuRsp, o, 1);
    o = buffer.writeUIntLE(req.mtu,                  o, 2);
    return buffer;
  }

  static deserialize(buffer: Buffer): AttExchangeMtuRspMsg|null {
    if (buffer.readUInt8(0) !== AttOpcode.ExchangeMtuRsp ||
        buffer.length       !== this.size) {
      return null;
    }
    return { mtu: buffer.readUIntLE(1, 2) };
  }
}

export interface AttFindInformationReqMsg {
  startingHandle: number; // First requested handle number
  endingHandle:   number; // Last requested handle number
}

export class AttFindInformationReq {
  private static readonly size = 5;

  static serialize(req: AttFindInformationReqMsg): Buffer {
    const buffer = Buffer.allocUnsafe(this.size);
    let o = 0;
    o = buffer.writeUIntLE(AttOpcode.FindInformationReq,  o, 1);
    o = buffer.writeUIntLE(req.startingHandle,            o, 2);
    o = buffer.writeUIntLE(req.endingHandle,              o, 2);
    return buffer;
  }

  static deserialize(buffer: Buffer): AttFindInformationReqMsg|null {
    if (buffer.readUInt8(0) !== AttOpcode.FindInformationReq ||
        buffer.length       !== this.size) {
      return null;
    }
    return {
      startingHandle: buffer.readUIntLE(1, 2),
      endingHandle:   buffer.readUIntLE(3, 2),
    };
  }
}

export interface AttFindInformationRspEntry {
  handle: number;
  uuid: Buffer;
}

export type AttFindInformationRspMsg = AttFindInformationRspEntry[];

export class AttFindInformationRsp {
  private static readonly minSize = 6;
  private static readonly uuidFormatToSize: Record<number, number> = { 1: 2, 2: 16 };
  private static readonly uuidSizeToFormat: Record<number, number> = { 2: 1, 16: 2 };

  static serialize(data: AttFindInformationRspMsg): Buffer {
    const uuidSize = this.getUuidSize(data);
    if (uuidSize === null) {
      throw new Error('Invalid ATT response data');
    }

    const format = this.uuidSizeToFormat[uuidSize];
    if (!format) {
      throw new Error('Invalid ATT response data');
    }

    const buffer = Buffer.allocUnsafe(2 + (2 + uuidSize) * data.length);

    let o = 0;
    o = buffer.writeUIntLE(AttOpcode.FindInformationRsp,  o, 1);
    o = buffer.writeUIntLE(format,                        o, 1);

    for (const entry of data) {
      o  = buffer.writeUIntLE(entry.handle, o, 2);
      o += entry.uuid.copy(buffer, o);
    }

    return buffer;
  }

  private static getUuidSize(data: AttFindInformationRspMsg): number|null {
    let uuidSize: number|null = null;

    for (const entry of data) {
      const length = entry.uuid.length;

      if (uuidSize === null) {
        uuidSize = length;

        if (uuidSize !== 2 && uuidSize !== 16) {
          return null;
        }
      }

      if (uuidSize !== length) {
        return null;
      }
    }

    return uuidSize;
  }

  static deserialize(buffer: Buffer): AttFindInformationRspMsg|null {
    if (buffer.readUInt8(0) !== AttOpcode.FindInformationRsp ||
        buffer.length        <  this.minSize) {
      return null;
    }

    // check uuid size
    const format = buffer.readUInt8(1);
    const uuidSize = this.uuidFormatToSize[format];
    if (!uuidSize) {
      return null;
    }
    if (((buffer.length - 2) % uuidSize) !== 0) {
      return null;
    }

    const result: AttFindInformationRspMsg = [];

    let o = 2;
    while (o < buffer.length) {
      const handle = buffer.readUIntLE(o, 2);       o += 2;
      const uuid   = buffer.slice(o, o + uuidSize); o += uuidSize;

      result.push({ handle, uuid: uuid.reverse(), });
    }

    return result;
  }
}

export interface AttFindByTypeValueReqMsg {
}

export class AttFindByTypeValueReq {
  static serialize(data: AttFindByTypeValueReqMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttFindByTypeValueReqMsg|null {
    return null;
  }
}

export interface AttFindByTypeValueRspMsg {
}

export class AttFindByTypeValueRsp {
  static serialize(data: AttFindByTypeValueRspMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttFindByTypeValueRspMsg|null {
    return null;
  }
}

export interface AttReadByTypeReqMsg {
}

export class AttReadByTypeReq {
  static serialize(data: AttReadByTypeReqMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadByTypeReqMsg|null {
    return null;
  }
}

export interface AttReadByTypeRspMsg {
}

export class AttReadByTypeRsp {
  static serialize(data: AttReadByTypeRspMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadByTypeRspMsg|null {
    return null;
  }
}

export interface AttReadReqMsg {
}

export class AttReadReq {
  static serialize(data: AttReadReqMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadReqMsg|null {
    return null;
  }
}

export interface AttReadRspMsg {
}

export class AttReadRsp {
  static serialize(data: AttReadRspMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadRspMsg|null {
    return null;
  }
}

export interface AttReadBlobReqMsg {
}

export class AttReadBlobReq {
  static serialize(data: AttReadBlobReqMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadBlobReqMsg|null {
    return null;
  }
}

export interface AttReadBlobRspMsg {
}

export class AttReadBlobRsp {
  static serialize(data: AttReadBlobRspMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadBlobRspMsg|null {
    return null;
  }
}

export interface AttReadMultipleReqMsg {
}

export class AttReadMultipleReq {
  static serialize(data: AttReadMultipleReqMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadMultipleReqMsg|null {
    return null;
  }
}

export interface AttReadMultipleRspMsg {
}

export class AttReadMultipleRsp {
  static serialize(data: AttReadMultipleRspMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadMultipleRspMsg|null {
    return null;
  }
}

export interface AttReadByGroupTypeReqMsg {
}

export class AttReadByGroupTypeReq {
  static serialize(data: AttReadByGroupTypeReqMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadByGroupTypeReqMsg|null {
    return null;
  }
}

export interface AttReadByGroupTypeRspMsg {
}

export class AttReadByGroupTypeRsp {
  static serialize(data: AttReadByGroupTypeRspMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadByGroupTypeRspMsg|null {
    return null;
  }
}

export interface AttWriteReqMsg {
}

export class AttWriteReq {
  static serialize(data: AttWriteReqMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttWriteReqMsg|null {
    return null;
  }
}

export interface AttWriteRspMsg {
}

export class AttWriteRsp {
  static serialize(data: AttWriteRspMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttWriteRspMsg|null {
    return null;
  }
}

export interface AttPrepareWriteReqMsg {
}

export class AttPrepareWriteReq {
  static serialize(data: AttPrepareWriteReqMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttPrepareWriteReqMsg|null {
    return null;
  }
}

export interface AttPrepareWriteRspMsg {
}

export class AttPrepareWriteRsp {
  static serialize(data: AttPrepareWriteRspMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttPrepareWriteRspMsg|null {
    return null;
  }
}

export interface AttExecuteWriteReqMsg {
}

export class AttExecuteWriteReq {
  static serialize(data: AttExecuteWriteReqMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttExecuteWriteReqMsg|null {
    return null;
  }
}

export interface AttExecuteWriteRspMsg {
}

export class AttExecuteWriteRsp {
  static serialize(data: AttExecuteWriteRspMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttExecuteWriteRspMsg|null {
    return null;
  }
}

export interface AttReadMultipleVariableReqMsg {
}

export class AttReadMultipleVariableReq {
  static serialize(data: AttReadMultipleVariableReqMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadMultipleVariableReqMsg|null {
    return null;
  }
}

export interface AttReadMultipleVariableRspMsg {
}

export class AttReadMultipleVariableRsp {
  static serialize(data: AttReadMultipleVariableRspMsg): Buffer {
    return Buffer.allocUnsafe(0);
  }

  static deserialize(buffer: Buffer): AttReadMultipleVariableRspMsg|null {
    return null;
  }
}
