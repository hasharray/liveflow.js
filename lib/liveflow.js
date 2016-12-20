var fs = require('fs');
var reassign = require('reassign');
var revaluate = require('revaluate');

var interval = 250;
if (process.env['NODE_WATCH_INTERVAL']) {
  interval = Number(process.env['NODE_WATCH_INTERVAL']);
}

var exclude = /(?!)/;
if (process.env['NODE_WATCH_EXCLUDE']) {
  exclude = RegExp(process.env['NODE_WATCH_EXCLUDE']);
}

var include = /.*/;
if (process.env['NODE_WATCH_INCLUDE']) {
  include = RegExp(process.env['NODE_WATCH_INCLUDE']);
}

require.extensions['.js'] = (function (instansiate) {
  return function(module, filename) {
    if (exclude.test(filename) || !include.test(filename)) {
      return instansiate(module, filename);
    }

    var content = fs.readFileSync(filename, 'utf-8');
    revaluate(content, filename, function (output) {
      module._compile(output.toString(), filename);
    });

    fs.watchFile(filename, {
      interval: interval,
      persistent: false,
    }, function() {
      var content = fs.readFileSync(filename, 'utf-8');

      revaluate(content, filename, function (output) {
        module._compile(output.toString(), filename);
      });

      process.emit('reload', module);
    });
  };
}(require.extensions['.js']));

require.extensions['.json'] = (function (instansiate) {
  return function(module, filename) {
    if (exclude.test(filename) || !include.test(filename)) {
      return instansiate(module, filename);
    }

    var content = fs.readFileSync(filename, 'utf-8');
    module.exports = JSON.parse(content);

    fs.watchFile(filename, {
      interval: interval,
      persistent: false,
    }, function() {
      var content = fs.readFileSync(filename, 'utf8');
      module.exports = reassign(module.exports, JSON.parse(content));

      process.emit('reload', module);
    });
  };
}(require.extensions['.json']));
