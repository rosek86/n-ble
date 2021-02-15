const SerialPort = require('serialport');

const H4 = require('../lib/H4').default;
const Hci = require('../lib/Hci').default;
const Address = require('../lib/Address').default;

const HciLe = require('../lib/HciLe');

const LePhy = HciLe.LePhy;
const LeAdvertisingEventProperties = HciLe.LeAdvertisingEventProperties;
const LeAdvertisingChannelMap = HciLe.LeAdvertisingChannelMap;
const LeOwnAddressType = HciLe.LeOwnAddressType;
const LePeerAddressType = HciLe.LePeerAddressType;
const LeAdvertisingFilterPolicy = HciLe.LeAdvertisingFilterPolicy;
const LePrimaryAdvertisingPhy = HciLe.LePrimaryAdvertisingPhy;
const LeSecondaryAdvertisingPhy = HciLe.LeSecondaryAdvertisingPhy;
const LeScanningFilterPolicy = HciLe.LeScanningFilterPolicy;
const LeScanType = HciLe.LeScanType;
const LeScanFilterDuplicates = HciLe.LeScanFilterDuplicates;

(async () => {
  try {
    const portInfo = await findHciPort();
    const port = await openHciPort(portInfo);

    const hci = new Hci({
      send: (packetType, data) => {
        port.write([packetType, ...data]);
      },
    });

    const h4 = new H4();
    port.on('data', (data) => {
      let result = h4.parse(data);
      do {
        if (result) {
          hci.onData(result.type, result.packet);
          result = h4.parse(Buffer.allocUnsafe(0));
        }
      } while (result);
    });
    port.on('error', (err) => {
      console.log(err);
    });

    await hci.reset();

    const localFeatures = await hci.readLocalSupportedFeatures();
    console.log(localFeatures);

    const localVersion = await hci.readLocalVersionInformation();
    console.log(localVersion);

    const bdAddress = new Address(await hci.readBdAddr());
    console.log(bdAddress.toString());

    const leBufferSize = await hci.leReadBufferSize();
    console.log(leBufferSize);

    const leFeatures = await hci.leReadSupportedFeatures();
    console.log(leFeatures);

    const leStates = await hci.leReadSupportedStates();
    console.log(leStates);

    const localCommands = await hci.readLocalSupportedCommands();
    console.log(localCommands);

    await hci.setEventMask();
    await hci.setEventMaskPage2();

    await hci.leSetEventMask();

    console.log(`Whitelist size: ${await hci.leReadWhiteListSize()}`);
    await hci.leClearWhiteList();

    console.log(`Resolving List size: ${await hci.leReadResolvingListSize()}`);
    await hci.leClearResolvingList();

    const maxDataLength = await hci.leReadMaximumDataLength();
    console.log(`Max data length: ${JSON.stringify(maxDataLength)}`);

    const suggestedMaxDataLength = await hci.leReadSuggestedDefaultDataLength();
    console.log(`Suggested max data length: ${JSON.stringify(suggestedMaxDataLength)}`);

    const advSets = await hci.leReadNumberOfSupportedAdvertisingSets();
    console.log(`number of supported advertising sets: ${advSets}`);

    await hci.leWriteSuggestedDefaultDataLength({
      suggestedMaxTxOctets: 27,
      suggestedMaxTxTime: 328,
    });

    await hci.leSetDefaultPhy({
      txPhys: LePhy.PhyCoded,
      rxPhys: LePhy.PhyCoded,
    });

    const selectedTxPower = await hci.leSetExtendedAdvertisingParameters({
      advertisingHandle: 0,
      advertisingEventProperties: [
        LeAdvertisingEventProperties.UseLegacyPDUs
      ],
      primaryAdvertisingIntervalMinMs: 1280,
      primaryAdvertisingIntervalMaxMs: 1280,
      primaryAdvertisingChannelMap: [
        LeAdvertisingChannelMap.Channel37,
        LeAdvertisingChannelMap.Channel38,
        LeAdvertisingChannelMap.Channel39,
      ],
      ownAddressType: LeOwnAddressType.RandomDeviceAddress,
      peerAddressType: LePeerAddressType.PublicDeviceAddress,
      peerAddress: 0x000000000000,
      advertisingFilterPolicy: LeAdvertisingFilterPolicy.Any,
      primaryAdvertisingPhy: LePrimaryAdvertisingPhy.Phy1M,
      secondaryAdvertisingMaxSkip: 0,
      secondaryAdvertisingPhy: LeSecondaryAdvertisingPhy.Phy1M,
      advertisingSid: 0,
      scanRequestNotificationEnable: false,
      advertisingTxPower: 0,
    });
    console.log(`TX Power: ${selectedTxPower}`);

    await hci.leSetAdvertisingSetRandomAddress({
      advertisingHandle: 0,
      advertisingRandomAddress: 0x1429c386d3a9,
    });

    await hci.leSetRandomAddress(0x153c7f2c4b82);
    await hci.leSetExtendedScanParameters({
      ownAddressType: LeOwnAddressType.RandomDeviceAddress,
      scanningFilterPolicy: LeScanningFilterPolicy.All,
      scanningPhy: {
        Phy1M: {
          type: LeScanType.Active,
          intervalMs: 11.25,
          windowMs: 11.25
        }
      }
    });

    await hci.leSetExtendedScanEnable({
      enable: true,
      filterDuplicates: LeScanFilterDuplicates.Enabled,
    });

    console.log('end');

  } catch (err) {
    console.log(err.message);
  } finally {
    // port.close();
  }
})();

async function findHciPort() {
  const portInfos = await SerialPort.list();

  const hciPortInfos = portInfos.filter(
    (port) => port.manufacturer === 'SEGGER'
  );

  if (hciPortInfos.length === 0) {
    throw new Error(`Cannot find appropriate port`);
  }

  return hciPortInfos[0];
}

async function openHciPort(portInfo) {
  const port = new SerialPort(portInfo.path, {
    autoOpen: false,
    baudRate: 1000000,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    rtscts: true,
  });

  const waitOpen = new Promise((resolve,  reject) => {
    port.on('open', () => resolve());
    port.open((err) => reject(err));
  });
  await waitOpen;

  return port;
}