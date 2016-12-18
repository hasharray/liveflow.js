var types = [
  'application/javascript',
  'application/ecmascript',
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
  'text/x-javascript'
];

var currentScript = (function() {
  if (document.currentScript) {
    return document.currentScript;
  }

  var scripts = document.getElementsByTagName('script');
  return scripts[scripts.length - 1];
}());

var documentElement = document.documentElement;

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

if (documentElement.hasAttribute('live')) {
  var revaluate = require('revaluate');
  var morphdom = require('morphdom');

  HTMLDocument.prototype.inject = function(content) {
    var contentElement = document.createElement('html');
    contentElement.innerHTML = content;
    contentElement.setAttribute('live', '');

    var scripts = contentElement.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (exclude.test(script.src) || !include.test(script.src)) {
        continue;
      }

      if (currentScript.src == script.src) {
        continue;
      }

      if (script.hasAttribute('type')) {
        var type = script.getAttribute('type');
        if (types.indexOf(type) < 0) {
          continue;
        }

        script.setAttribute('data-type', type);
        script.removeAttribute('type');
      }

      script.setAttribute('type', 'thingamajig/javascript');
    }

    morphdom(this.documentElement, contentElement, {
      getNodeKey: function(node) {
        if (/SCRIPT/.test(node.tagName)) {
          if (node.getAttribute('id')) {
            return node.tagName + '#' + node.getAttribute('id');
          }

          if (node.hasAttribute('src')) {
            return node.tagName + '[src=' + node.getAttribute('src') + ']';
          }
        }

        return node.id;
      },
      onBeforeNodeAdded: function(node) {
        if (/SCRIPT/.test(node.tagName)) {
          var script = document.createElement('script');
          var attributes = node.attributes;

          for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes[i];
            script.setAttribute(attribute.name, attribute.value);
          }

          script.appendChild(document.createTextNode(node.textContent));

          return script;
        }

        return node;
      },
    });
  };

  HTMLDocument.prototype.reload = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.documentURI);
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        this.inject(xhr.responseText);
      }

      var reload = document.createEvent('Event');
      reload.initEvent('reload', true, false);
      this.dispatchEvent(reload);
    }.bind(this);

    xhr.send(null);
  };

  HTMLScriptElement.prototype.inject = function(content) {
    var filename = this.id;
    if (this.src) {
      filename = this.src
      .replace(/[?&]reload=.*/, '');
    }

    revaluate(content, filename, function(output) {
      eval(output.toString());
    });

    var reload = document.createEvent('Event');
    reload.initEvent('reload', true, false);
    this.dispatchEvent(reload);
  };

  HTMLScriptElement.prototype.reload = function() {
    if (this.type != 'thingamajig/javascript') {
      return location.reload();
    }

    if (this.src) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', this.src, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          this.inject(xhr.responseText);
        }
      }.bind(this);

      xhr.send(null);
    } else {
      this.inject(this.text);
    }
  };

  HTMLLinkElement.prototype.reload = function() {
    var href = this.getAttribute('href')
      .replace(/[?&]reload=.*/, '')
      .replace(/.*/, function(value) {
        return value + (/\?/.test(value) ? '&' : '?') + 'reload=' + Date.now();
      });

    this.setAttribute('href', href);

    var reload = document.createEvent('Event');
    reload.initEvent('reload', true, false);
    element.dispatchEvent(reload);
  };

  HTMLImageElement.prototype.reload = function() {
    var src = this.getAttribute('src')
      .replace(/[?&]reload=.*/, '')
      .replace(/.*/, function(value) {
        return value + (/\?/.test(value) ? '&' : '?') + 'reload=' + Date.now();
      });

    this.setAttribute('src', src);

    var reload = document.createEvent('Event');
    reload.initEvent('reload', true, false);
    element.dispatchEvent(reload);
  };

  window.reload = function reload(pattern) {
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
        if (!pattern.test(value)) {
          continue;
        }

        element.reload();
      }
    }

    if (pattern.test(location.href)) {
      document.reload();
    }
  };

  window.onload = function() {
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

        var filename = script.getAttribute('id');
        var text = script.text;
        if (text != contents[filename]) {
          if (contents[filename]) {
            script.inject(text);
          }

          contents[filename] = text;
        }
      }

      setTimeout(next, 250, contents);
    }, 0, {});

    setTimeout(function next(headers, requests) {
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

      setTimeout(next, interval, headers, requests);
    }, 0, {}, {});
  };
} else {
  document.write('<plaintext>');
  document.onreadystatechange = function() {
    if (documentElement.hasAttribute('live')) {
      return;
    }

    if (document.readyState != 'interactive') {
      return;
    }

    documentElement.setAttribute('live', '');

    var outerHTML = documentElement.outerHTML
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

      if (script.hasAttribute('type')) {
        var type = script.getAttribute('type');
        if (types.indexOf(type) < 0) {
          continue;
        }

        script.setAttribute('data-type', type);
        script.removeAttribute('type');
      }

      if (script.hasAttribute('id')) {
        script.setAttribute('data-id', script.id);
      }

      script.setAttribute('id', 'script-' + i);

      if (script.hasAttribute('src')) {
        script.text = [
          '  script.type = \'thingamajig/javascript\';',
          '  script.src = \'' + script.getAttribute('src') + '\';',
          '  script.text = \'\';',
          '',
          '  var xhr = new XMLHttpRequest();',
          '  xhr.open(\'GET\', script.src, script.async);',
          '  xhr.onreadystatechange = function() {',
          '    if (xhr.readyState == 4) {',
          '      script.inject(xhr.responseText);',
          '    }',
          '  };',
          '',
          '  xhr.send(null);',
        ].join('\n');

        script.removeAttribute('src');
      } else {
        script.text = [
          '  script.type = \'thingamajig/javascript\';',
          '  script.text = unescape(\'' + escape(script.text) + '\');',
          '  script.inject(script.text)',
        ].join('\n');
      }

      script.text = [
        '(function(script) {',
        '  if (script.hasAttribute(\'data-id\')) {',
        '    script.setAttribute(\'id\', script.getAttribute(\'data-id\'));',
        '    script.removeAttribute(\'data-id\');',
        '  } else {',
        '    script.removeAttribute(\'id\');',
        '  }',
        '',
        '  script.removeAttribute(\'script\')',
        script.text,
        '}(document.getElementById(\'' + script.getAttribute('id') + '\')));',
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
}
