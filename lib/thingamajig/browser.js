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

setTimeout(function next(contents) {
  var scripts = document.scripts;

  for (var i = 0; i < scripts.length; i++) {
    var script = scripts[i];

    if (script.hasAttribute('src')) {
      continue;
    }

    if (script.getAttribute('type') != 'thingamajig/javascript') {
      continue;
    }

    var title = script.getAttribute('title');
    if (script.textContent != contents[title]) {
      var content = script.textContent;
      if (contents[title]) {
        revaluate(content, title, function(output) {
          eval(output.code);
        });

        var reload = document.createEvent('Event');
        reload.initEvent('reload', true, false);
        script.dispatchEvent(reload);
      }

      contents[name] = content;
    }
  }

  setTimeout(next, 250, contents);
}, 0, {});


setTimeout(function next(headers, pending) {
  var urls = [];

  if (!pending[location.href]) {
    urls.push(location.href);
  }

  var scripts = document.scripts;
  for (var i = 0; i < scripts.length; i++) {
    var script = scripts[i];

    if (!script.hasAttribute('src')) {
      continue;
    }

    if (pending[script.getAttribute('src')]) {
      continue;
    }

    urls.push(script.getAttribute('src'));
  }

  var links = document.getElementsByTagName('link');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];

    if (!link.hasAttribute('href')) {
      continue;
    }

    urls.push(link.getAttribute('href'));
  }

  var images = document.getElementsByTagName('img');
  for (var i = 0; i < images.length; i++) {
    var image = images[i];

    if (!image.hasAttribute('src')) {
      continue;
    }

    urls.push(image.getAttribute('src'));
  }

  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    if (exclude.test(url) || !include.test(url)) {
      continue;
    }

    var xhr = new XMLHttpRequest();
    setTimeout(function(url, xhr) {
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
          var type = xhr.getResponseHeader('Content-Type').split(';')[0]

          var reload = document.createEvent('Event');
          reload.initEvent('reload', true, false);

          switch (type) {
            case 'image/svg+xml':
            case 'image/png':
            case 'image/jpeg':
            case 'image/webp':
            case 'image/bmp':
              var images = document.getElementsByTagName('img');
              for (var i = 0; i < images.length; i++) {
                var image = images[i];
                if (image.getAttribute('src') != url) {
                  continue;
                }

                image.removeAttribute('src');
                image.setAttribute('src', url);
                image.dispatchEvent(reload);
              }

              break;
            case 'text/css':
              var links = document.getElementsByTagName('link');
              for (var i = 0; i < links.length; i++) {
                var link = links[i];

                if (url != link.getAttribute('href')) {
                  continue;
                }

                link.removeAttribute('href');
                link.setAttribute('href', url);
                link.dispatchEvent(reload);

              }
              break;
            case 'text/html':
              location.reload();
              break;

            case 'text/javascript':
            case 'application/javascript':
            case 'application/x-javascript':
              var scripts = document.getElementsByTagName('script');
              for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i];

                if (url == script.getAttribute('src')) {
                  if (script.getAttribute('type') == 'thingamajig/javascript') {
                    xhr.open('GET', url, true);
                    xhr.addEventListener('load', function() {
                      var content = xhr.responseText;

                      revaluate(content, url, function(output) {
                        eval(output.code);
                      });

                      script.dispatchEvent(reload);
                      delete pending[url];
                    }, false);

                    xhr.send(null);
                  } else {
                    location.reload();
                  }
                }
              }
              break;
          }
        } else {
          delete pending[url];
        }
      }, false);

      xhr.send(null);
    }, 0, url, xhr);

    pending[url] = xhr;
  }

  setTimeout(next, 250, headers, pending);
}, 0, {}, {});
