var assert = require('assert');
var child = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');

var dirname = fs.mkdtempSync(os.tmpdir() + path.sep);
var files = {
  'script.js': path.join(dirname, 'script.js'),
};

fs.writeFileSync(files['script.js'], [
  'console.log(\'ready\');',
  'process.on(\'reload\', function() {',
  '  console.log(\'done\');',
  '});',
  'setTimeout(function() {}, 60 * 1000);',
].join('\n'), 'utf8');

var script = child.spawn(process.execPath, [
  '--require',
  require.resolve('..'),
  files['script.js']
]);

var stdout = [
  'ready',
  'reload',
  'done',
];

script.stdout.setEncoding('utf8');
script.stdout.on('data', function(chunk) {
  var lines = chunk.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.length == 0) {
      continue;
    }

    assert.equal(stdout.shift(), line);

    switch (line) {
      case 'ready':
        setTimeout(function() {
          fs.writeFileSync(files['script.js'], [
            'console.log(\'reload\');',
            'process.on(\'reload\', function() {',
            '  console.log(\'done\');',
            '});',
            'setTimeout(function() {}, 60 * 1000);',
          ].join('\n'), 'utf8');
        }, 1000);
        break;

      case 'done':
        script.kill('SIGTERM');
        break;
    }
  }
});

script.stderr.setEncoding('utf8');
script.stderr.on('data', function(chunk) {
  assert.fail(chunk);
});

script.on('exit', function(code, signal) {
  assert.equal(signal, 'SIGTERM');
});
