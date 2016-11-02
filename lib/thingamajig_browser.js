var revaluate = require('revaluate');
var currentScript = document.currentScript;

setTimeout(function (callback) {
  var request = new XMLHttpRequest();

  request.open('GET', location.href);
  request.onload = function(event) {
    var html = request.responseText
      .replace(/type=\"text\/javascript\"/g, '')
      .replace(/<script/g, '<script type="live/javascript"');

    var head = /<head>([\S\s]*)<\/head>/.exec(html);
    if (head) {
      document.head.innerHTML = head[1];
    }

    var body = /<body>([\S\s]*)<\/body>/.exec(html);
    if (body) {
      document.body.innerHTML = body[1];
    }

    setTimeout(function next(index) {
      var script = document.scripts[index];
      if (script == null) {
        return setTimeout(callback, 0, {});
      }
      if (script.getAttribute('src') == currentScript.getAttribute('src')) {
        console.log(script.getAttribute('src'));
        script.parentElement.removeChild(script);
      } else if (/cdn/.test(script.getAttribute('src'))) {
        var clone = document.createElement('script');

        if (script.hasAttribute('async')) {
          clone.setAttribute('async', script.getAttribute('async'));
          setTimeout(next, 0, ++index);
        } else {
          clone.onload = function() {
            setTimeout(next, 0, ++index);
          };
        }

        script.parentElement.replaceChild(clone, script);
        clone.setAttribute('src', script.getAttribute('src'));
      } else if (script.hasAttribute('src')) {
        script.setAttribute('name', script.getAttribute('src'));

        request = new XMLHttpRequest();
        request.open('GET', script.getAttribute('src'));

        if (script.hasAttribute('async')) {
          request.onload = function() {
            revaluate(request.responseText, script.getAttribute('name'), function(output) {
              eval(output.code);
            });
          };

          setTimeout(next, 0, ++index);
        } else {
          request.onload = function() {
            revaluate(request.responseText, script.getAttribute('name'), function(output) {
              eval(output.code);
            });
          };

          setTimeout(next, 0, ++index);
        }

        request.onerror = function() {};
        request.send(null);
      } else {
        script.setAttribute('name', index);

        revaluate(script.innerText, script.getAttribute('name'), function(output) {
          eval(output.code);
        });

        setTimeout(next, 0, ++index);
      }
    }, 0, 0);
  };

  request.onerror = function() {};
  request.send(null);
}, 0, function next(pending) {
  var scripts = document.scripts;
  for (var i = 0; i < scripts.length; i++) {
    var script = scripts[i];

    if (script.getAttribute('type') != 'live/javascript') {
      continue;
    }

    if (pending[script.getAttribute('name')]) {
      continue;
    }

    pending[script.getAttribute('name')] = setTimeout(function(script) {
      if (script.hasAttribute('src')) {
        pending[
          script.getAttribute('name')
        ] = setTimeout(function callback(headers, script) {
          var request = new XMLHttpRequest();
          request.open('HEAD', script.getAttribute('src'));
          request.onload = function() {
            var names = [ 'Last-Modified' ];

            for (var i = 0; i < names.length; i++) {
              var name = names[i];

              if (headers[name] && headers[name] != request.getResponseHeader(name)) {
                var modified = true;
              }

              headers[name] = request.getResponseHeader(name);
            }

            if (modified) {
              request.open('GET', script.getAttribute('src'));
              request.onload = function() {
                revaluate(request.responseText, script.getAttribute('name'), function(output) {
                  eval(output.code);
                });

                setTimeout(callback, 250, headers, script);
              };

              request.send(null);
            } else {
              setTimeout(callback, 250, headers, script);
            }
          };

          request.onerror = function() {};
          request.send(null);
        }, 0, {}, script);
      } else {
        pending[
          script.getAttribute('name')
        ] = setTimeout(function callback(textContent, script) {
          if (textContent != script.textContent) {
            revaluate(script.textContent, script.getAttribute('name'), function(output) {
              eval(output.code);
            });
          }

          pending[
            script.getAttribute('name')
          ] = setTimeout(callback, 250, script.textContent, script);
        }, 250, script.textContent, script);
      }
    }, 0, script);
  }

  setTimeout(next, 0, pending);
});
