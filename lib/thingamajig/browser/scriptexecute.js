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
      .replace(/type=\"text\/javascript\"/g, 'data-type')
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
