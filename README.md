# Liveflow.js - Live Editing for Node.js and Browsers

Liveflow.js is a *small* runtime extension that enables live-editing of
scripts as-well as live-reloading of required json files.

It's a pure, self-contained JavaScript based implementation with no external
parts and *should* work in any more or less any JavaScript runtime, be it
Node.js, Chrome, Firefox, Safari, Internet Explorer or Microsoft Edge.

## Features

##### Live Editing of Scripts

Whenever scripts are changed on disk, across the network or within the document
object model itself (e.g inline script tags) the source of that script is
re-evaluated in its original execution context.

Re-evaluation means the following things:
* Modified and new top level call expressions are called.
* Surviving call expressions yield their previous value.
* Function modifications are applied.

##### Live Reloading of Documents

Whenever a document is changed on disk or across the network,
the page will be reloaded.

##### Live Reloading of Style Sheets

Whenever style-sheets are changed on disk or across the network, the old style
link will be replaced with a new one causing the style-sheet to reload.

##### Live Reloading of Images

Whenever image sources are changed on disk or across the network, the image
elements linking to that file will be reloaded.

##### Live Reloading of JSON

Whenever the source of a JSON file changes on disk that has been imported with
`require`, it will reload and replace the key/value pairs on the original
object.

*This only applies to Node.js environments.*

## Getting Started

Liveflow.js has been designed to be as **configuration free** as possible,
just include the script in your runtime environment and be done with it.

### Node.js

1. Install the `liveflow` module.
```
npm install liveflow
```

2. Start node with the `--require` (shorthand `-r`) option, passing in
`liveflow` as the module name to require.

```
node -r liveflow myapp.js
```

3. Enjoy live editing and reloading.

### Browser

1. Include the following script at the very top of the `head` section in your
document, it should be the first element after the opening `<head>` tag.

```html
<script src="//liveflow.js.org/liveflow.js"></script>
```

2. Open the document in your preferred browser.

3. Enjoy live editing and reloading.

## Documentation

See [https://liveflow.js.org](https://liveflow.js.org).

## License

MIT
