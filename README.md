# snapline

[![Circle CI](https://circleci.com/gh/pmdartus/snapline.svg?style=svg)](https://circleci.com/gh/pmdartus/snapline)

> Unleash your screenshots stored in Chrome Devtool timeline files

## Features

* Convert timeline to gif
* Extract screenshots save in a timeline into a folder

## Install

Before using snapline, please install `imageMagick` and ensure that your version of node is greater than `4.0`.

```shell
npm install -g snapline
```

## CLI usage

```shell
> snapline -h

Usage: snapline <timeline> [options]

Options:
--help        Show help                                              [boolean]
-o, --output  Output file name              [string] [default: "timeline.gif"]
-f, --fps     Number of frames per seconds            [number] [default: "10"]
```

## Node usage

```js
const snapline = require('../src')
const timeline = require('./my-awesome-timeline.json')

snapline.toGif(timeline)
  .then(gifPath => console.log(`The gif(t) is ready: ${gifPath}!`))
```

## API

### `snapline.toGif(timeline[, options])`

* `timeline` <timelineEntry[]> - The parsed JSON content of the timeline file
* `options` <Object>
  * `output` <String> - path of the gif. default: `./timeline.gif`
  * `fps` <Number> - Number of frames per seconds. default: `10`

Returns a `Promise` that resolves with the path of the created gif

### `snaplie.toImages(timeline[, options])`

* `timeline` <timelineEntry[]> - The parsed JSON content of the timeline file
* `options` <Object>
  * `output` <String> - folder path that will contains the screenshots. default: `./screenshots`
  * `fps` <Number> - Number of frames per seconds. default: `10`

Returns a `Promise` that resolves with the path of the path of the created directory

## License

MIT. See `/LICENSE`

## Owner

Pierre-Marie Dartus - [@pmdartus](https://github.com/pmdartus)
