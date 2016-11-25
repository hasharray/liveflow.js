var revaluate = require('revaluate');

var currentScript = (function() {
  if (document.currentScript) {
    return document.currentScript;
  }

  var scripts = document.getElementsByTagName('script');
  return scripts[scripts.length - 1];
}());

var interval = 250;
if (currentScript.hasAttribute('data-interval')) {
  interval = Number(currentScript.getAttribute('data-interval'));
}

var exclude = /cdn/;
if (currentScript.hasAttribute('data-exclude')) {
  exclude = RegExp(currentScript.getAttribute('data-exclude'));
}

var include = /.*/;
if (currentScript.hasAttribute('data-include')) {
  include = RegExp(currentScript.getAttribute('data-include'));
}

var headers = {};
var requests = {};
var contents = {};

document.addEventListener('beforescriptexecute', function(event) {
  var script = event.target;
  if (script.hasAttribute('src')) {
    var filename = script.getAttribute('src');
    if (exclude.test(filename) || !include.test(filename)) {
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', filename, script.hasAttribute('async'));
    xhr.addEventListener('load', function() {
      revaluate(xhr.responseText, filename, function(output) {
        eval(output.code);
      });
    }, false);

    xhr.send(null);
  } else {
    script.setAttribute('title', Date.now().toString(36));
    revaluate(script.innerText, script.getAttribute('title'), function(output) {
      eval(output.code);
    });
  }

  script.setAttribute('type', 'thingamajig/javascript');
  event.preventDefault();
}, false);

reload = function reload(url) {
  if (url in requests) {
    return;
  }

  var xhr = (requests[url] = new XMLHttpRequest());
  xhr.open('HEAD', url, true);
  xhr.addEventListener('load', function(event) {
    var modified = false;

    if (headers[url]) {
      var names = [ 'Last-Modified' ];

      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var prev = headers[url][name];
        var curr = xhr.getResponseHeader(name);

        if (prev != curr) {
          modified = true;
          break;
        }
      }
    } else {
      headers[url] = {};
    }

    var head = xhr.getAllResponseHeaders();
    var entries = head.split('\u000d\u000a');

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];

      var index = entry.indexOf('\u003a\u0020');
      if (index > 0) {
        var name = entry.substring(0, index);
        var value = entry.substring(index + 2);
        headers[url][name] = value;
      }
    }

    if (modified) {
      var type = xhr.getResponseHeader('Content-Type').split(';')[0];
      reload.types[type](url);
    }

    delete requests[url];
  });

  xhr.send(null);
};

reload.types = {};

reload.types['image/bmp'] =
reload.types['image/gif'] =
reload.types['image/jpeg'] =
reload.types['image/png'] =
reload.types['image/svg+xml'] =
reload.types['image/tiff'] =
reload.types['image/webp'] = function(url) {
  var images = document.getElementsByTagName('img');
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    if (image.getAttribute('src') != url) {
      continue;
    }

    image.removeAttribute('src');
    image.setAttribute('src', url);

    var reload = document.createEvent('Event');
    reload.initEvent('reload', true, false);
    image.dispatchEvent(reload);
  }
};

reload.types['text/css'] = function(url) {
  var links = document.getElementsByTagName('link');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (link.getAttribute('href') != url) {
      continue;
    }

    link.removeAttribute('href');
    link.setAttribute('href', url);

    var reload = document.createEvent('Event');
    reload.initEvent('reload', true, false);
    link.dispatchEvent(reload);
  }
};

reload.types['text/html'] = function(url) {
  location.reload();
};

reload.types['application/javascript'] =
reload.types['text/javascript'] = function(url) {
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    var script = scripts[i];
    if (script.getAttribute('src') != url) {
      continue;
    }

    if (script.getAttribute('type') == 'thingamajig/javascript') {
      var xhr = (requests[url] = new XMLHttpRequest());
      xhr.open('GET', url, true);
      xhr.onload = function() {
        var content = xhr.responseText;

        revaluate(content, url, function(output) {
          eval(output.code);
        });

        var reload = document.createEvent('Event');
        reload.initEvent('reload', true, false);
        script.dispatchEvent(reload);

        delete requests[url];
      };

      xhr.send(null);
    } else {
      location.reload();
    }
  }
};

setTimeout(function next() {
  var scripts = document.scripts;

  for (var i = 0; i < scripts.length; i++) {
    var script = scripts[i];

    if (script.hasAttribute('src')) {
      continue;
    }

    if (script.getAttribute('type') != 'thingamajig/javascript') {
      continue;
    }

    var filename = script.getAttribute('title');
    if (script.textContent != contents[filename]) {
      var content = script.textContent;
      if (contents[filename]) {
        revaluate(content, filename, function(output) {
          eval(output.code);
        });

        var reload = document.createEvent('Event');
        reload.initEvent('reload', true, false);
        script.dispatchEvent(reload);
      }

      contents[filename] = content;
    }
  }

  setTimeout(next, 250);
}, 0);

setTimeout(function next() {
  var elements = [];
  elements.push.apply(elements, document.getElementsByTagName('img'));
  elements.push.apply(elements, document.getElementsByTagName('link'));
  elements.push.apply(elements, document.getElementsByTagName('script'));

  var urls = [
    location.href,
  ];

  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];

    if (element.hasAttribute('href')) {
      urls.push(element.getAttribute('href'));
    }

    if (element.hasAttribute('src')) {
      urls.push(element.getAttribute('src'));
    }
  }

  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    if (exclude.test(url) || !include.test(url)) {
      continue;
    }

    reload(url);
  }

  setTimeout(next, 250);
}, 0);
