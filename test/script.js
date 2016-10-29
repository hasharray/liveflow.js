var assert = require('assert');
var fs = require('fs');
var os = require('os');
var child = require('child_process');

var path = require('path');

var dirname = fs.mkdtempSync(os.tmpdir());
var filename = path.join(dirname, 'script.js');

var content = [
  'var fs = require(\'fs\');',
  'var path = require(\'path\');',
  '',
  'setInterval(function() {});'
].join('\n');

fs.writeFileSync(filename, content, 'utf8');

var ps = child.fork(filename, [
  '--require ' + require.resolve('..'),
]);

ps.on('message', function(message) {
  assert.equal(message, 'done');
  ps.kill('SIGTERM');
});

content += 'process.send(\'done\');';
fs.writeFileSync(filename, content, 'utf8');
