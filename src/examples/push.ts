'use strict';

// import pyatv, { type NodePyATVDeviceEvent } from '@sebbo2002/node-pyatv';
import pyatv, { type NodePyATVDeviceEvent } from '../lib/index.js';

(async () => {
    const devices = await pyatv.find(/*{debug: true}*/);
    if (!devices.length) {
        throw new Error(
            'Oh no. Unable to find any devices. If you find devices with atvremote, please enable the debug log.',
        );
    }

    console.log(
        `🔍 Found ${devices.length} device${devices.length > 1 ? 's' : ''}:`,
    );
    if (devices.length > 1) {
        for (const i in devices) {
            const device = devices[i];
            console.log(`   - ${device.name} (${device.host})`);
        }
    }

    const device = devices.find((d) => d.name === 'Wohnzimmer') || devices[0];
    console.log(
        `\n⚡️ Subscribe to live events on ${device.name} (press any key to stop)`,
    );
    await new Promise((resolve, reject) => {
        const errorListener = (error: Error | NodePyATVDeviceEvent) =>
            reject(error);
        const updateListener = (event: Error | NodePyATVDeviceEvent) => {
            if (event instanceof Error || event.key === 'dateTime') return;
            console.log(
                `   ${event.key}: ${event?.value} (was ${event?.oldValue})`,
            );
        };
        const keyPressListener = () => {
            console.log('\n⏳ Remove event listeners…');
            device.off('update', updateListener);
            device.off('error', errorListener);
            process.stdin.off('data', keyPressListener);
            resolve(undefined);
        };

        device.on('update', updateListener);
        device.on('error', errorListener);
        process.stdin.on('data', keyPressListener);
    });

    console.log('🎉 Thank you');
    process.exit(0);
})().catch((error) => {
    console.log(`🚨 Error: ${error.stack || error}`);
    process.exit(1);
});
