import Hci from './Hci';

let sendEvent: ((_: Buffer) => void) | null = null;

(async () => {
  try {
    const hci = new Hci({
      send: (data) => console.log(data.toString('hex')),
      setEventHandler: (handler) => sendEvent = handler,
    });

    setImmediate(() => sendEvent!(Buffer.from('0e0401030c00', 'hex')));
    await hci.reset();
  } catch (err) {
    console.log(err);
  }
})();
