![NodeJS CI](https://github.com/cometd/cometd-nodejs-client/workflows/NodeJS%20CI/badge.svg)

## The CometD Project

### CometD NodeJS Client

This project implements adapter code that allows the [CometD JavaScript Client](https://github.com/cometd/cometd-javascript) to run in a NodeJS environment.

The adapter code exports an implementation of `XMLHttpRequest` so that the CometD JavaScript Client works in NodeJS as it does within a browser environment.

WebSocket is supported via the [`ws`](https://www.npmjs.com/package/ws) package.

### NPM Installation

Firstly, you need to install the CometD NodeJS Client:

```
npm install cometd-nodejs-client
```

The CometD NodeJS Client does not depend on the CometD JavaScript Client; you need the CometD JavaScript Client to develop your applications.

Therefore, you need to install the CometD JavaScript Client, version 3.1.2 or greater:

```
npm install cometd
```

### Usage (CommonJS)

```javascript
// Run the adapter code that implements XMLHttpRequest.
require('cometd-nodejs-client').adapt();

// Your normal CometD client application here.
var lib = require('cometd');
var cometd = new lib.CometD();
...
```

### Usage (ES Modules)

```javascript
import { CometD } from 'cometd';
import { adapt } from 'cometd-nodejs-client';
// Shim XMLHTTPRequest for Node.js (required by CometD).
adapt();

// Your normal CometD client application here.
const client = new CometD();
```

See [here](https://github.com/cometd/cometd-javascript/blob/master/README.md) for an example CometD client application.
