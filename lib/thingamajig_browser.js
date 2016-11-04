var revaluate = require('revaluate');

if (typeof thingamajig == 'undefined') {
  stop();

  var xhr = new XMLHttpRequest();
  xhr.open('GET', location.href);
  xhr.onload = function(event) {
    var html = xhr.responseText
      .replace(/type=\"text\/javascript\"/g, '')
      .replace(/<script/g, '<script type="live/javascript"');

    document.write(html);
    document.close();

    var scripts = document.scripts;

    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (script.getAttribute('type') != 'live/javascript') {
        continue;
      }

      if (script.hasAttribute('src')) {
        script.setAttribute('name', script.getAttribute('src'));

        xhr = new XMLHttpRequest();
        xhr.open('GET', script.getAttribute('src'));
        xhr.onload = function() {
          revaluate(xhr.responseText, script.getAttribute('name'), function(output) {
            eval(output.code);
          });
        };

        xhr.onerror = function() {};
        xhr.send(null);
      } else {
        script.setAttribute('name', i);

        revaluate(script.innerText, script.getAttribute('name'), function(output) {
          eval(output.code);
        });
      }
    }
  };

  xhr.onerror = function() {};
  xhr.send(null);

  setTimeout(function next(contents) {
    var scripts = document.scripts;

    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];

      if (script.hasAttribute('src')) {
        continue;
      }

      if (script.getAttribute('type') != 'live/javascript') {
        continue;
      }

      var name = script.getAttribute('name');

      if (script.textContent != contents[name]) {
        var content = script.textContent;
        if (contents[name]) {
          revaluate(content, name, function(output) {
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

      if (script.getAttribute('type') != 'live/javascript') {
        continue;
      }

      if (pending[script.getAttribute('name')]) {
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
                    if (script.getAttribute('type') == 'live/javascript') {
                      xhr.open('GET', url, true);
                      xhr.onload = function() {
                        var scripts = 0;
                        var content = xhr.responseText;

                        revaluate(content, url, function(output) {
                          eval(output.code);
                        });

                        delete pending[url];
                      };

                      xhr.send(null);
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

  thingamajig = true;
}
