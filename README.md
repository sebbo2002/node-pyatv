# node-pyatv

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Unit Tests](https://img.shields.io/github/actions/workflow/status/sebbo2002/node-pyatv/test-release.yml?style=flat-square)](https://github.com/sebbo2002/node-pyatv/actions?query=workflow%3ARelease+branch%3Amain)

A lightweight wrapper around pyatv's which also supports realtime notifications.


## 📝 Content
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Changelog](https://github.com/sebbo2002/node-pyatv/blob/main/CHANGELOG.md)
- [FAQ](#-faq)


## ☁ Installation

Before you use `node-pyatv` you need to install pyatv. This module woun't do this for you. Run `atvremote --version` to
double check your installation. See FAQ section for installation tips.

To install the javascript module via npm just run:

	npm install @sebbo2002/node-pyatv


## ⚒ Quick Start

```typescript
import pyatv, {NodePyATVDeviceEvent} from '@sebbo2002/node-pyatv';

const devices = await pyatv.find(/*{debug: true}*/);
if (!devices.length) {
    throw new Error('Oh no.');
}

const device = devices[0];

// request current title
console.log(await device.getTitle());

// request full state
console.log(await device.getState());

// subscribe to events
device.on('update:deviceState', (event: NodePyATVDeviceEvent | Error) => {
    if(event instanceof Error) return;
    console.log(`Current device state is ${event.value}`);
});
```


## 📑 API Reference

The API documentation is automatically generated from the code comments and can be found
[here](https://sebbo2002.github.io/node-pyatv/main/reference/).


## 📑 Changelog

Please have a look at [CHANGELOG.md](https://github.com/sebbo2002/node-pyatv/blob/main/CHANGELOG.md) to see the changelog.


## 🤨 FAQ

#### How to install pyatv

```bash
pip3 install pyatv
```


#### How to debug things

You can pass `"debug": true` for any command called. Some debug information is then printed via console.log. Additionaly
you can pass a function to process debugs logs.


#### Why are some tests skipped?

Some unit tests require a responding apple tv to pass. These tests are disabled by default. You can set the environment
variable `ENABLE_INTEGRATION=1` to enable them.


#### Is this secure?

Defenitely not. For example, there's no escaping for parameters passed to pyatv. So be sure to double check the data you
pass to this library, otherwise it may be possible to run code on your machine.


## Copyright and license

Copyright (c) Sebastian Pekarek under the [MIT license](LICENSE).
