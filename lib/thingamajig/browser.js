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

document.write('<plaintext>');
document.onreadystatechange = function() {
  document.onreadystatechange = null;

  var element = document.documentElement;
  var html = element.innerText;

  document.open();
  (function write(chunks, index, offset) {
    if (index == chunks.length) {
      return document.close();
    }

    var chunk = chunks[index++]
      .replace(/$/, '\n')
      .replace(/<script.*/g, function(value) {
        var url = /src="(.*)"/.exec(value);
        if (url) {
          if (exclude.test(url[1]) || !include.test(url[1])) {
            return value;
          }

          return value
            .replace(/<script/, '<script type="thingamajig/javascript"');
        }

        return value
          .replace(/<script/, '<script title="' + index + '"')
          .replace(/<script/, '<script type="thingamajig/javascript"');
      });

    document.write(chunk);

    var scripts = document.getElementsByTagName('script');
    if (offset < scripts.length) {
      var script = scripts[offset++];
      if (script.getAttribute('type') != 'thingamajig/javascript') {
        return setTimeout(write, 0, chunks, index, offset);
      }

      if (script.hasAttribute('src')) {
        var url = script.getAttribute('src');

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            revaluate(xhr.responseText, url, function(output) {
              eval(output.toString());
            })
          }
        };

        xhr.send(null);
      }

      var name = script.getAttribute('title');
      var content = script.innerText;

      revaluate(content, name, function(output) {
        eval(output.toString());
      })
    }

    setTimeout(write, 0, chunks, index, offset);
  }(html.split(/\n/), 0, 0));
};

window.reload = function reload(pattern) {
  if (typeof pattern == 'string') {
    pattern = RegExp(pattern);
  }

  var images = document.getElementsByTagName('img');
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    if (!pattern.test(image.getAttribute('src'))) {
      continue;
    }

    var url = image.getAttribute('src')
      .replace(/[?&]reload=.*/, '')
      .replace(/.*/, function(value) {
        return value + (/\?/.test(value) ? '&' : '?') + 'reload=' + Date.now();
      });

    image.setAttribute('src', url);

    var reload = document.createEvent('Event');
    reload.initEvent('reload', true, false);
    image.dispatchEvent(reload);
  }

  var links = document.getElementsByTagName('link');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (pattern.test(link.getAttribute('href'))) {
      continue;
    }

    var url = link.getAttribute('src')
      .replace(/[?&]reload=.*/, '')
      .replace(/.*/, function(value) {
        return value + (/\?/.test(value) ? '&' : '?') + 'reload=' + Date.now();
      });

    link.setAttribute('href', url);

    var reload = document.createEvent('Event');
    reload.initEvent('reload', true, false);
    link.dispatchEvent(reload);
  }

  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    var script = scripts[i];
    if (!pattern.test(script.getAttribute('src'))) {
      continue;
    }

    var url = script.getAttribute('src')
      .replace(/[?&]reload=.*/, '')
      .replace(/.*/, function(value) {
        return value + (/\?/.test(value) ? '&' : '?') + 'reload=' + Date.now();
      });

    script.setAttribute('src', url);

    (function(script) {
      var url = script.getAttribute('src')
        .replace(/[?&]reload=.*/, '');

      var xhr = (requests[url] = new XMLHttpRequest());

      xhr.open('GET', script.getAttribute('src'), true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          revaluate(xhr.responseText, url, function(output) {
            eval(output.toString());
          });

          delete requests[url];
        };
      };
      xhr.send(null);
    }(script));

    var reload = document.createEvent('Event');
    reload.initEvent('reload', true, false);
    script.dispatchEvent(reload);
  }

  if (pattern.test(location.href)) {
    location.reload();
  }
};

window.onload = function() {
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
      var url = urls[i].replace(/[?&]reload=.*$/, '');
      if (exclude.test(url) || !include.test(url)) {
        continue;
      }

      if (url in requests) {
        continue;
      }

      (function(url) {
        var xhr = (requests[url] = new XMLHttpRequest());
        xhr.open('HEAD', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
            if (headers[url]) {
              var names = [ 'Last-Modified' ];

              for (var i = 0; i < names.length; i++) {
                var name = names[i];
                var prev = headers[url][name];
                var curr = xhr.getResponseHeader(name);

                if (prev && curr && prev != curr) {
                  window.reload(url);
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

            delete requests[url];
          }
        };

        xhr.send(null);
      }(url));
    }

    setTimeout(next, 250);
  }, 0);
};
