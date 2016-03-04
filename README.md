# snapline

[![Circle CI](https://circleci.com/gh/pmdartus/snapline.svg?style=svg)](https://circleci.com/gh/pmdartus/snapline)

> Unleash your screenshots stored in Chrome Devtool timeline files

## Install

Before using snapline, please install `imageMagick` and ensure that your version of node is greater than `4.0`.

```shell
npm install -g snapline
```

## CLI usage

```shell
> snapline -h

    Usage: bin/snapline <timeline> [options]

    Options:
    --help        Show help                                              [boolean]
    -o, --output  Output file name              [string] [default: "timeline.gif"]
```

## Node usage

```js
const snapline = require('../src')
const timeline = require('./my-awesome-timeline.json')

snapline(timeline)
  .saveGif()
  .then(gifPath => console.log(`The gif(t) is ready: ${gifPath}!`))
```

## API



## License

MIT. See `/LICENSE`

## Owner

Pierre-Marie Dartus - [@pmdartus](https://github.com/pmdartus)
