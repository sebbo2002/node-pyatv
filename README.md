# node-pyatv

[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
![Status](https://git-badges.sebbo.net/98/master/build)

A lightweight wrapper around pyatv's which also supports realtime notifications.


## ☁ Installation

Before you use `node-pyatv` you need to install pyatv and unbuffer. This module woun't do this for you. See FAQ section for installation tips.

To install the javascript module via npm just run:

	npm install @sebbo2002/node-pyatv


## ⚒ Quick Start

```javascript
const pyatv = require('@sebbo2002/node-pyatv');
pyatv
    .scan()
    .then(results => {
        results.forEach(atv => {
            const listener = atv.push();

            listener.on('error', error => {
                console.log(`Listener Error for ${atv.name}: ${error}`);
            });
            listener.on('close', () => {
                console.log(`Listener for ${atv.name} closed`);
            });

            setTimeout(() => {
                listener.close();
            }, 60000);
        });
    })
    .catch(error => {
        console.log('Error during scan:', error);
    });
```


## 📑 API

### static scan([_Object_ options])

Scanns for devices on your network.

```javascript
const pyatv = require('@sebbo2002/node-pyatv');

pyatv
    .scan({debug: true})
    .then(results => {
        results.forEach(atv =>
            console.log(atv.toString())
        );
    })
    .catch(error => {
        console.log(error);
    });
```

#### Options
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Default</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>timeout</td>
            <td>Timeout in seconds for scanning</td>
            <td>Nothing, atvremove's default is 3</td>
            <td>No</td>
        </tr>
    </tbody>
</table>



### static version([_Object_ options])

Returns relevant version information.

```javascript
const pyatv = require('@sebbo2002/node-pyatv');

pyatv
    .version({debug: false})
    .then(version => {
        console.log(`pyatv version: ${version.pyatv}`);
        console.log(`node-pyatv version: ${version.module}`);
    })
    .catch(error => {
        console.log(error);
    });
```


### static connect(address, loginId, [_Object_ options])

Returns a apple tv instance with the given credentials.

```javascript
const pyatv = require('@sebbo2002/node-pyatv');
const atv = pyatv.connect('192.168.2.1', '*****************************');

atv.deviceId().then(id => console.log);
```



### Key Presses

```javascript
const pyatv = require('@sebbo2002/node-pyatv');
const atv = pyatv.connect();

/*
 * - up()
 * - right()
 * - down()
 * - left()
 * - menu()
 * - next()
 * - pause()
 * - play()
 * - previous()
 * - stop()
 * - topMenu()
 * - select()
 */

atv.menu()
    .catch(err => {});
```


### artworkUrl()

```javascript
const pyatv = require('@sebbo2002/node-pyatv');
const atv = pyatv.connect();

atv.artworkUrl()
    .then(url => console.log(`Artwork URL: ${url}`))
    .catch(err => {});
```


### deviceId()

```javascript
const pyatv = require('@sebbo2002/node-pyatv');
const atv = pyatv.connect();

atv.deviceId()
    .then(url => console.log(`Device ID: ${url}`))
    .catch(err => {});
```


### playing()

```javascript
const pyatv = require('@sebbo2002/node-pyatv');
const atv = pyatv.connect();

atv.playing()
    .then(playing => console.log(playing))
    .catch(err => {});

/*
 * Example Response:
 * {
 *     mediaType: 'video',
 *     playState: 'playing',
 *     title: '',
 *     position: 658,
 *     totalTime: 2591,
 *     repeat: false,
 *     shuffle: false
 * }
 */
```


### push()

Listen for push updates

```javascript
const pyatv = require('@sebbo2002/node-pyatv');
pyatv
    .scan({debug: true})
    .then(results => {
        results.forEach(atv => {
            const listener = atv.push();

            listener.on('state', playing => {
                console.log(playing);
            });
            listener.on('error', error => {
                console.log(`Listener Error for ${atv.name}: ${error}`);
            });
            listener.on('close', () => {
                console.log(`Listener for ${atv.name} closed`);
            });

            setTimeout(() => {
                listener.close();
            }, 30000);
        });
    })
    .catch(error => {
        console.log('Error during scan:', error);
    });
```



## 🤨 FAQ

#### How to install pyatv and unbuffer on macOS

```bash
pip3 install pyatv

# homebrew required
brew install expect
```


#### How to debug things

You can pass `"debug": true` for any command called. Some debug information is then printed via console.log. Additionaly 
you can pass an alternative function to process debugs logs within the `log` option.


## Copyright and license

Copyright (c) Sebastian Pekarek under the [MIT license](LICENSE).
