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

var exclude = /cdn|liveflow/;
if (currentScript.hasAttribute('data-exclude')) {
  exclude = RegExp(currentScript.getAttribute('data-exclude'));
}

var include = /.*/;
if (currentScript.hasAttribute('data-include')) {
  include = RegExp(currentScript.getAttribute('data-include'));
}

if (document.inject == null) {
  document.write('<plaintext>');
  document.onreadystatechange = function() {
    if (document.inject || document.readyState != 'interactive') {
      return;
    }

    var clone = document.cloneNode(true);
    var element = clone.documentElement;
    element.innerHTML = element.innerHTML
      .replace(/<\/head><body><plaintext>/i, '')
      .replace(/<\/plaintext>[\S\s]*$/i, '')
      .replace(/(?!&amp;)&lt;/g, '<')
      .replace(/(?!&amp;)&gt;/g, '>');

    var executable = [
      'application/ecmascript',
      'application/javascript',
      'application/x-ecmascript',
      'application/x-javascript',
      'text/ecmascript',
      'text/javascript',
      'text/javascript1.0',
      'text/javascript1.1',
      'text/javascript1.2',
      'text/javascript1.3',
      'text/javascript1.4',
      'text/javascript1.5',
      'text/jscript',
      'text/livescript',
      'text/x-ecmascript',
      'text/x-javascript',
    ];

    var scripts = element.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (script.hasAttribute('type')) {
        var type = script.getAttribute('type');
        if (executable.indexOf(type) < 0) {
          continue;
        }

        script.setAttribute('data-type', type);
        script.removeAttribute('type');
      }

      if (script.hasAttribute('src')) {
        var src = script.getAttribute('src');
        script.setAttribute('data-src', src);
        script.removeAttribute('src');
      }

      if (script.hasAttribute('id')) {
        var id = script.getAttribute('id');
        script.setAttribute('data-id', id);
      }

      script.setAttribute('id', 'script-' + i);
      script.text = [
        '(function(script) {',
        '  script.setAttribute(\'type\', \'script\');',
        '  if (script.hasAttribute(\'data-id\')) {',
        '    script.setAttribute(\'id\', script.getAttribute(\'data-id\'));',
        '    script.removeAttribute(\'data-id\');',
        '  } else {',
        '    script.removeAttribute(\'id\');',
        '  }',
        '',
        '  if (script.hasAttribute(\'data-src\')) {',
        '    script.setAttribute(\'src\', script.getAttribute(\'data-src\'));',
        '    script.removeAttribute(\'data-src\');',
        '  }',
        '  if (!script.hasAttribute(\'id\')) {',
        '    if (script.hasAttribute(\'src\')) {',
        '      var id = script.getAttribute(\'src\');',
        '      script.setAttribute(\'id\', id);',
        '    }',
        '  }',
        '  script.text = unescape(\'' + escape(script.text) + '\');',
        '',
        '  document.inject(script, script);',
        '}(document.getElementById(\'' + script.getAttribute('id') + '\')));',
      ].join('\n');
    }

    document.open();
    document.inject = function(target, source) {
      var morph = require('morphdom');
      var revaluate = require('revaluate');

      var scripts = [];
      if (source.nodeName == 'SCRIPT') {
        scripts.push(source);
      } else {
        scripts.push.apply(scripts, source.getElementsByTagName('script'));
      }

      for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        if (script.hasAttribute('type')) {
          var type = script.getAttribute('type');
          if (type != 'script') {
            if (executable.indexOf(type) < 0) {
              continue;
            }

            script.setAttribute('data-type', type);
          }
        }

        script.setAttribute('type', 'script');

        if (!script.hasAttribute('id')) {
          if (script.hasAttribute('src')) {
            var id = script.getAttribute('src')
              .replace(/[?&]reload=.*/, '');

            script.setAttribute('id', id);
          }
        }
      }

      var result = morph(target, source);

      var scripts = [];
      if (result.nodeName == 'SCRIPT') {
        scripts.push(result);
      } else {
        scripts.push.apply(scripts, result.getElementsByTagName('script'));
      }

      for (var i = 0; i < scripts.length; i++) {
        var script = scripts[i];
        if (script.getAttribute('type') != 'script') {
          continue;
        }

        if (script.src && script.src != script.cache) {
          script.cache = script.src;

          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
              script.content = xhr.responseText;

              if (exclude.test(script.src) || !include.test(script.src)) {
                eval([
                  script.content,
                  '//# sourceURL=' + script.src,
                ].join('\n'));
              } else {
                revaluate(script.content, script.id, function(output) {
                  eval(output.toString());
                });
              }

              var load = document.createEvent('Event');
              load.initEvent('load', false, false);
              script.dispatchEvent(load);
            }
          };

          xhr.open('GET', script.src, false);
          xhr.send(null);
        } else if (script.text && script.text != script.content) {
          script.content = script.text;

          revaluate(script.content, script.id, function(output) {
            eval(output.toString());
          });
        }
      }

      var inject = document.createEvent('Event');
      inject.initEvent('inject', true, false);
      result.dispatchEvent(inject);

      return result;
    };

    document.reload = function(pattern) {
      if (typeof pattern == 'string') {
        pattern = RegExp(pattern);
      }

      var elements = [];
      elements.push.apply(elements, document.getElementsByTagName('img'));
      elements.push.apply(elements, document.getElementsByTagName('link'));
      elements.push.apply(elements, document.getElementsByTagName('script'));

      var names = [
        'src',
        'href',
      ];

      for (var i = 0; i < elements.length; i++) {
        var element = elements[i];

        for (var j = 0; j < names.length; j++) {
          var name = names[j];

          var value = element.getAttribute(name);
          if (pattern.test(value)) {
            var clone = element.cloneNode(true);
            var url = value
              .replace(/[?&]reload=.*/, '')
              .replace(/.*/, function(value) {
                return value + (/\?/.test(value) ? '&' : '?') + 'reload=' + Date.now();
              });

            clone.setAttribute(name, url);
            document.inject(element, clone);
          }
        }
      }

      if (pattern.test(location.href)) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            var clone = document.cloneNode(true);
            clone.documentElement.innerHTML = xhr.responseText;

            document.inject(document.documentElement, clone.documentElement);
          }
        };

        xhr.open('GET', location.href);
        xhr.send(null);
      }
    };

    document.write(element.outerHTML);
    document.close();

    window.setInterval(function next(headers, requests) {
      if (Number.isNaN(interval)) {
        return;
      }

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

        requests[url] = window.setTimeout(function(url) {
          var xhr = new XMLHttpRequest();
          xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
              if (headers[url]) {
                var names = [ 'Last-Modified' ];

                for (var i = 0; i < names.length; i++) {
                  var name = names[i];
                  var prev = headers[url][name];
                  var curr = xhr.getResponseHeader(name);

                  if (prev && curr && prev != curr) {
                    document.reload(url);
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

          xhr.open('HEAD', url, true);
          xhr.send(null);
        }, 0, url);
      }
    }, interval, {}, {});
  };
}
