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

(function() {
  if ('onbeforescriptexecute' in document) {
    return;
  }

  window.stop();

  var scripts = document.getElementsByTagName('script');
  var skip = scripts.length;
  document.open();

  setTimeout(function () {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', location.href);
    xhr.onload = function(event) {
      document.write(xhr.responseText
        .replace(/type=\"text\/javascript\"/g, 'data-beforescriptexecutetype')
        .replace(/<script/g, '<script type="beforescriptexecute"')
      );
      document.close();

      var scripts = document.getElementsByTagName('script');
      setTimeout(function execute(index) {
        if (index == scripts.length) {
          return;
        }

        var script = scripts[index];
        if (script.getAttribute('type') != 'beforescriptexecute') {
          setTimeout(execute, 0, ++index);
        }

        if (script.hasAttribute('data-beforescriptexecutetype')) {
          script.removeAttribute('data-beforescriptexecutetype');
          script.setAttribute('type', 'text/javascript');
        } else {
          script.removeAttribute('type');
        }

        if (index < skip) {
          return setTimeout(execute, 0, ++index);
        }

        var beforescriptexecute = document.createEvent('Event');
        beforescriptexecute.initEvent('beforescriptexecute', true, true);
        if (!script.dispatchEvent(beforescriptexecute)) {
          return setTimeout(execute, 0, ++index);
        }

        var afterscriptexecute = document.createEvent('Event');
        afterscriptexecute.initEvent('afterscriptexecute', true, true);

        if (script.hasAttribute('src')) {
          script.addEventListener('load', function(event) {
            script.dispatchEvent(afterscriptexecute);
            setTimeout(execute, 0, ++index);
          }, false);
        } else {
          setTimeout(execute, 0, ++index);
        }

        var placeholder = document.createElement('span');
        script.parentElement.replaceChild(placeholder, script);
        placeholder.parentElement.replaceChild(script, placeholder);

        if (!script.hasAttribute('src')) {
          script.dispatchEvent(afterscriptexecute);
        }
      }, 0, 0);
    };

    xhr.send(null);
  });
}());

document.addEventListener('beforescriptexecute', function(event) {
  var script = event.target;
  if (script.hasAttribute('src')) {
    var filename = script.getAttribute('src');
    if (exclude.test(filename) || !include.test(filename)) {
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', filename, script.hasAttribute('async'));
    xhr.onload = function() {
      revaluate(xhr.responseText, filename, function(output) {
        eval(output.code);
      });
    };

    xhr.send(null);
  } else {
    script.setAttribute('title', Date.now().toString(36));
    revaluate(script.innerText, script.getAttribute('title'), function(output) {
      eval(output.code);
    });
  }

  script.setAttribute('live', '');
  event.preventDefault();
});

setTimeout(function next(contents) {
  var scripts = document.scripts;

  for (var i = 0; i < scripts.length; i++) {
    var script = scripts[i];

    if (script.hasAttribute('src')) {
      continue;
    }

    if (!script.hasAttribute('live')) {
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

      xhr.onload = function(event) {
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
                  if (script.hasAttribute('live')) {
                    xhr.open('GET', url, true);
                    xhr.onload = function() {
                      var content = xhr.responseText;

                      revaluate(content, url, function(output) {
                        eval(output.code);
                      });

                      script.dispatchEvent(reload);
                      delete pending[url];
                    };

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
      };

      xhr.send(null);
    }, 0, url, xhr);

    pending[url] = xhr;
  }

  setTimeout(next, 250, headers, pending);
}, 0, {}, {});
