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

var exclude = /(?!)/;
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
      for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        if (script.getAttribute('type') != 'beforescriptexecute') {
          continue;
        }

        if (script.hasAttribute('data-beforescriptexecutetype')) {
          script.removeAttribute('data-beforescriptexecutetype');
          script.setAttribute('type', 'text/javascript');
        } else {
          script.removeAttribute('type');
        }

        if (i < skip) {
          continue;
        }

        var beforescriptexecute = document.createEvent('Event');
        beforescriptexecute.initEvent('beforescriptexecute', true, true);
        if (!script.dispatchEvent(beforescriptexecute)) {
          continue;
        }

        var placeholder = document.createElement('span');
        script.parentElement.replaceChild(placeholder, script);
        placeholder.parentElement.replaceChild(script, placeholder);
        
        var afterscriptexecute = document.createEvent('Event');
        afterscriptexecute.initEvent('afterscriptexecute', true, true);
        script.dispatchEvent(afterscriptexecute);
      }
    };

    xhr.send(null);
  });
}());

document.addEventListener('beforescriptexecute', function(event) {
  var script = event.target;
  script.setAttribute('live', '');

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

          switch (type) {
            case 'text/css':
              var links = document.getElementsByTagName('link');
              for (var i = 0; i < links.length; i++) {
                var link = links[i];

                if (url == link.getAttribute('href')) {
                  var clone = document.createElement('link');
                  clone.setAttribute('type', 'text/css');
                  clone.setAttribute('rel', 'stylesheet');
                  clone.setAttribute('href', url);

                  link.parentElement.replaceChild(clone, link);
                }
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