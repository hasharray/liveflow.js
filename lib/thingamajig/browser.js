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

var root = document.documentElement;
if (!root.hasAttribute('live')) {
  document.write('<plaintext>');
  document.onreadystatechange = function() {
    if (root.hasAttribute('live')) {
      return;
    }

    if (document.readyState != 'interactive') {
      return;
    }

    root.setAttribute('live', '');

    var outerHTML = root.outerHTML
      .replace(/<\/head><body><plaintext>/i, '')
      .replace(/<\/plaintext>[\S\s]*$/i, '')
      .replace(/(?!&amp;)&lt;/g, '<')
      .replace(/(?!&amp;)&gt;/g, '>');

    var head = document.createElement('head');
    head.innerHTML = /<head[\S\s]*?>[\S\s]*<\/head>/i.exec(outerHTML);

    var body = document.createElement('body');
    body.innerHTML = /<body[\S\s]*?>[\S\s]*<\/body>/i.exec(outerHTML);

    var scripts = [];
    scripts.push.apply(scripts, head.getElementsByTagName('script'));
    scripts.push.apply(scripts, body.getElementsByTagName('script'));

    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (exclude.test(script.src) || !include.test(script.src)) {
        continue;
      }

      if (currentScript.src == script.src) {
        continue;
      }

      script.text = [
        'script.type = \'thingamajig/javascript\';',
        'script.text = unescape(\'' + escape(script.text) + '\');',
      ].join('\n');

      if (script.src) {
        script.text = [
          script.text,
          'script.src = \'' + script.getAttribute('src') + '\';',
          'script.reload(script.async);'
        ].join('\n');

        script.removeAttribute('src');
      } else {
        script.text = [
          script.text,
          'script.reload(false);'
        ].join('\n');
      }

      script.text = [
        '(function(script) {',
        script.text,
        '}(document.currentScript));',
      ].join('\n');
    }

    var documentHTML = outerHTML
      .replace(/^/, '<!DOCTYPE html>\n')
      .replace(/<(head[\S\s]*?)>([\S\s]*)<\/(head)>/i, [
        '<$1>', head.innerHTML, '</$3>',
      ].join(''))
      .replace(/<(body[\S\s]*?)>([\S\s]*)<\/(body)>/i, [
        '<$1>', body.innerHTML,'</$3>',
      ].join(''));

    document.open();
    document.write(documentHTML);
    document.close();
  };
} else {
  var revaluate = require('revaluate');

  HTMLScriptElement.prototype.reload = function(defer) {
    if (this.type != 'thingamajig/javascript') {
      return location.reload();
    }

    if (this.src) {
      var src = this.getAttribute('src')
        .replace(/[?&]reload=.*/, '');

      var xhr = (requests[src] = new XMLHttpRequest());
      xhr.open('GET', this.src, defer);
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          revaluate(xhr.responseText, src, function(output) {
            eval(output.toString());
          });

          var reload = document.createEvent('Event');
          reload.initEvent('reload', true, false);
          this.dispatchEvent(reload);

          delete requests[src];
        }
      }.bind(this);

      xhr.send(null);
    } else {
      revaluate(this.text, this.title, function(output) {
        eval(output.toString());
      });

      var reload = document.createEvent('Event');
      reload.initEvent('reload', true, false);
      this.dispatchEvent(reload);
    }
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
      script.reload();
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
            script.reload(false);
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
}
