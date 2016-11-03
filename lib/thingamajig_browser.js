var revaluate = require('revaluate');

if (typeof thingamajig == 'undefined') {
  var request = new XMLHttpRequest();

  request.open('GET', location.href);
  request.onload = function(event) {
    var html = request.responseText
      .replace(/<head(.*)>[\S\s]*?<\/script>/, '<head$1>')
      .replace(/type=\"text\/javascript\"/g, '')
      .replace(/<script/g, '<script type="live/javascript"');

    var head = /<html>[\S\s]*<head>([\S\s]*)<\/head>[\S\s]*<body>/.exec(html);
    if (head) {
      document.head.innerHTML = head[1];
    }

    var body = /<\/head>[\S\s]*<body>([\S\s]*)<\/body>[\S\s]<\/html>/.exec(html);
    if (body) {
      document.body.innerHTML = body[1];
    }

    var scripts = document.scripts;

    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (script.getAttribute('type') != 'live/javascript') {
        continue;
      }

      if (script.hasAttribute('src')) {
        script.setAttribute('name', script.getAttribute('src'));

        request = new XMLHttpRequest();
        request.open('GET', script.getAttribute('src'));
        request.onload = function() {
          revaluate(request.responseText, script.getAttribute('name'), function(output) {
            eval(output.code);
          });
        };

        request.onerror = function() {};
        request.send(null);
      } else {
        script.setAttribute('name', i);

        revaluate(script.innerText, script.getAttribute('name'), function(output) {
          eval(output.code);
        });
      }
    }
  };

  request.onerror = function() {};
  request.send(null);

  setTimeout(function next(pending) {
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
  }, 0, {});

  thingamajig = true;
}
