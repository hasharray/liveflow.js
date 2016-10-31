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

var ps = child.spawn('node', [
  '--require ' + require.resolve('..'),
  filename,
]);

ps.stdout.on('data', function(chunk) {
  var message = chunk.toString('utf8');
  assert.equal(message, 'done');
  ps.kill('SIGTERM');
});

content += 'console.log(\'done\');';
fs.writeFileSync(filename, content, 'utf8');
