Timeline
========

## Getting Started

### Prerequisites

You'll need to install node.js and npm first.  You can get them by hitting
the `install` button over at http://nodejs.org/.

### Dependencies

To install `timeline` dependencies,
run:

``` sh
npm install
```

Create an empty folder to create your timeline.  `timeline` will parse
all files in this folder and watches the filesystem for updates.

Run the daemon from the folder that you created.  For example:

``` sh
cd /home/me/MyTimeline
node /home/me/gitstuff/timeline/lib/serve.js
```

Then point your browser to http://localhost:8888/.

![screenshot](https://raw.github.com/tillberg/timeline/master/example.png)

## Timeline file format

Use plain text files to create your timeline.  For example:

```
December 31, 1999 - January 1, 2000
Partied like it was 1999

December 2000
Partied like it was still 1999?
```

You can specify background colors by adding a `color:` line.  This
will apply to all events for the remainder of the file.

```
color: hotpink

December 2013
Wrote timeline instead of partying
```

### License

MIT
