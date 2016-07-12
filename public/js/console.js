/**
 * Constructor for command storage.
 * It uses localStorage if available. Otherwise fallback to normal JS array.
 */
function CommandStorage() {
  this.previousCommands = [];
  var previousCommandOffset = 0;
  var hasLocalStorage = typeof window.localStorage !== 'undefined';
  var STORAGE_KEY = "web_console_previous_commands";
  var MAX_STORAGE = 100;

  if (hasLocalStorage) {
    this.previousCommands = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    previousCommandOffset = this.previousCommands.length;
  }

  this.addCommand = function(command) {
    previousCommandOffset = this.previousCommands.push(command);

    if (previousCommandOffset > MAX_STORAGE) {
      this.previousCommands.splice(0, 1);
      previousCommandOffset = MAX_STORAGE;
    }

    if (hasLocalStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.previousCommands));
    }
  };

  this.navigate = function(offset) {
    previousCommandOffset += offset;

    if (previousCommandOffset < 0) {
      previousCommandOffset = -1;
      return null;
    }

    if (previousCommandOffset >= this.previousCommands.length) {
      previousCommandOffset = this.previousCommands.length;
      return null;
    }

    return this.previousCommands[previousCommandOffset];
  }
}

function Autocomplete(words, prefix) {
  this.words = words.concat(); // to clone object
  this.words.sort(); // by alphabetically order
  this.current = -1;
  this.left = 0; // [left, right)
  this.right = words.length;
  this.confirmed = false;

  function createKeyword(label) {
    var el = document.createElement('span');
    el.innerText = label;
    addClass(el, 'keyword');
    return el;
  }

  this.view = document.createElement('pre');
  addClass(this.view, 'console-message');
  addClass(this.view, 'auto-complete');
  for (var key in this.words) {
    this.view.appendChild(createKeyword(this.words[key]));
  }

  this.refine(prefix, true);
}

Autocomplete.prototype.onFinished = function(callback) {
  this.onFinishedCallback = callback;
  if (this.confirmed) callback(this.confirmed);
};

Autocomplete.prototype.refine = function(prefix, inc) {
  var self = this;

  function toggle(el) {
    if (hasClass(el, 'selected')) removeClass(el, 'selected');
    return inc ? addClass(el, 'hidden') : removeClass(el, 'hidden');
  }

  function startsWith(str, prefix) {
    return !prefix || str.substr(0, prefix.length) === prefix;
  }

  function moveRight(l, r) {
    while (l < r && inc !== startsWith(self.words[l], prefix)) {
      toggle(self.view.children[l]);
      ++ l;
    }
    return l;
  }

  function moveLeft(l, r) {
    while (l < r - 1 && inc !== startsWith(self.words[r - 1], prefix)) {
      toggle(self.view.children[r - 1]);
      -- r;
    }
    return r;
  }

  if (inc) {
    self.left = moveRight(self.left, self.right);
    self.right = moveLeft(self.left, self.right);
  } else {
    self.left = moveLeft(0, self.left);
    self.right = moveRight(self.right, self.words.length);
  }

  if (self.current < self.left) {
    self.current = self.left - 1;
  } else if (self.current > self.right) {
    self.current = self.right;
  }

  if (self.left + 1 >= self.right) {
    self.current = self.left;
    self.finish();
  }
};

Autocomplete.prototype.finish = function() {
  if (this.left <= this.current && this.current < this.right) {
    if (this.onFinishedCallback) this.onFinishedCallback(this.words[this.current]);
    this.removeView();
    this.confirmed = this.words[this.current];
  } else {
    this.cancel();
  }
};

Autocomplete.prototype.cancel = function() {
  if (this.onFinishedCallback) this.onFinishedCallback();
  this.removeView();
};

Autocomplete.prototype.removeView = function() {
  if (this.view.parentNode) this.view.parentNode.removeChild(this.view);
  removeAllChildren(this.view);
}

Autocomplete.prototype.select = function(nextCurrent) {
  if (0 <= this.current && this.current < this.words.length) removeClass(this.view.children[this.current], 'selected');
  addClass(this.view.children[nextCurrent], 'selected');
  this.current = nextCurrent;
};

Autocomplete.prototype.next = function() {
  this.select(this.current + 1 >= this.right ? this.left : this.current + 1);
};

Autocomplete.prototype.back = function() {
  this.select(this.current - 1 < this.left ? this.right - 1 : this.current - 1);
};

// HTML strings for dynamic elements.
var consoleInnerHtml = "<div class=\'resizer layer\'><\/div>\n<div class=\'console-outer layer\'>\n  <div class=\'console-actions\'>\n    <div class=\'close-button button\' title=\'close\'>x<\/div>\n  <\/div>\n  <div class=\'console-inner\'><\/div>\n<\/div>\n<input class=\'clipboard\' type=\'text\'>\n"
;
var promptBoxHtml = "<span class=\'console-prompt-label\'><\/span>\n<pre class=\'console-prompt-display\'><\/pre>\n"
;
// CSS
var consoleStyleCss = ".console .pos-absolute { position: absolute; }\n.console .pos-fixed { position: fixed; }\n.console .pos-right { right: 0; }\n.console .border-box { box-sizing: border-box; }\n.console .layer { width: 100%; height: 100%; }\n.console .layer.console-outer { z-index: 1; }\n.console .layer.resizer { z-index: 2; }\n.console { position: fixed; left: 0; bottom: 0; width: 100%; height: 148px; padding: 0; margin: 0; background: none repeat scroll 0% 0% #333; z-index: 9999; }\n.console .console-outer { overflow: auto; padding-top: 4px; }\n.console .console-inner { font-family: monospace; font-size: 11px; width: 100%; height: 100%; overflow: none; background: #333; }\n.console .console-prompt-box { color: #FFF; }\n.console .console-message { color: #1AD027; margin: 0; border: 0; white-space: pre-wrap; background-color: #333; padding: 0; }\n.console .console-message.error-message { color: #fc9; }\n.console .console-message.auto-complete { word-break: break-all; }\n.console .console-message.auto-complete .keyword { margin-right: 11px; }\n.console .console-message.auto-complete .keyword.selected { background: #FFF; color: #000; }\n.console .console-message.auto-complete .hidden { display: none; }\n.console .console-focus .console-cursor { background: #FEFEFE; color: #333; font-weight: bold; }\n.console .resizer { background: #333; width: 100%; height: 4px; cursor: ns-resize; }\n.console .console-actions { padding-right: 3px; }\n.console .console-actions .button { float: left; }\n.console .button { cursor: pointer; border-radius: 1px; font-family: monospace; font-size: 13px; width: 14px; height: 14px; line-height: 14px; text-align: center; color: #ccc; }\n.console .button:hover { background: #666; color: #fff; }\n.console .button.close-button:hover { background: #966; }\n.console .clipboard { height: 0px; padding: 0px; margin: 0px; width: 0px; margin-left: -1000px; }\n.console .console-prompt-label { display: inline; color: #FFF; background: none repeat scroll 0% 0% #333; border: 0; padding: 0; }\n.console .console-prompt-display { display: inline; color: #FFF; background: none repeat scroll 0% 0% #333; border: 0; padding: 0; }\n.console.full-screen { height: 100%; }\n.console.full-screen .console-outer { padding-top: 3px; }\n.console.full-screen .resizer { display: none; }\n.console.full-screen .close-button { display: none; }\n"
;
// Insert a style element with the unique ID
var styleElementId = 'sr02459pvbvrmhco';

// REPLConsole Constructor
function REPLConsole(config) {
  function getConfig(key, defaultValue) {
    return config && config[key] || defaultValue;
  }

  this.commandStorage = new CommandStorage();
  this.prompt = getConfig('promptLabel', ' >>');
  this.mountPoint = getConfig('mountPoint');
  this.sessionId = getConfig('sessionId');
  this.autocomplete = false;
}

REPLConsole.prototype.getSessionUrl = function(path) {
  var parts = [ this.mountPoint, 'repl_sessions', this.sessionId ];
  if (path) {
    parts.push(path);
  }
  // Join and remove duplicate slashes.
  return parts.join('/').replace(/([^:]\/)\/+/g, '$1');
};

REPLConsole.prototype.commandHandle = function(line, callback) {
  var self = this;
  var params = 'input=' + encodeURIComponent(line);
  callback = callback || function() {};

  function isSuccess(status) {
    return status >= 200 && status < 300 || status === 304;
  }

  function parseJSON(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  function getErrorText(xhr) {
    if (!xhr.status) {
      return "Oops! Failed to connect to the Web Console middleware.\nPlease make sure a rails development server is running.\n";
    } else {
      return xhr.status + ' ' + xhr.statusText;
    }
  }

  function getContext() {
    var s = self.getCurrentWord();
    var methodOp = s.lastIndexOf('.');
    var moduleOp = s.lastIndexOf('::');
    var x = methodOp > moduleOp ? methodOp : moduleOp;
    if (x !== -1) return s.substr(0, x);
  }

  if (this.autocomplete) {
    var c = getContext();
    params += c ? '&context=' + c : c;
  }

  putRequest(self.getSessionUrl(), params, function(xhr) {
    var response = parseJSON(xhr.responseText);
    var result   = isSuccess(xhr.status);
    if (result) {
      self.writeOutput(response.output);
    } else {
      if (response && response.output) {
        self.writeError(response.output);
      } else {
        self.writeError(getErrorText(xhr));
      }
    }
    callback(result, response);
  });
};

REPLConsole.prototype.uninstall = function() {
  this.container.parentNode.removeChild(this.container);
};

REPLConsole.prototype.install = function(container) {
  var _this = this;

  document.onkeydown = function(ev) {
    if (_this.focused) { _this.onKeyDown(ev); }
  };

  document.onkeypress = function(ev) {
    if (_this.focused) { _this.onKeyPress(ev); }
  };

  document.addEventListener('mousedown', function(ev) {
    var el = ev.target || ev.srcElement;

    if (el) {
      do {
        if (el === container) {
          _this.focus();
          return;
        }
      } while (el = el.parentNode);

      _this.blur();
    }
  });

  // Render the console.
  container.innerHTML = consoleInnerHtml;

  var consoleOuter = findChild(container, 'console-outer');
  var consoleActions = findChild(consoleOuter, 'console-actions');

  addClass(container, 'console');
  addClass(container.getElementsByClassName('layer'), 'pos-absolute border-box');
  addClass(container.getElementsByClassName('button'), 'border-box');
  addClass(consoleActions, 'pos-fixed pos-right');

  // Make the console resizable.
  function resizeContainer(ev) {
    var startY              = ev.clientY;
    var startHeight         = parseInt(document.defaultView.getComputedStyle(container).height, 10);
    var scrollTopStart      = consoleOuter.scrollTop;
    var clientHeightStart   = consoleOuter.clientHeight;

    var doDrag = function(e) {
      container.style.height = (startHeight + startY - e.clientY) + 'px';
      consoleOuter.scrollTop = scrollTopStart + (clientHeightStart - consoleOuter.clientHeight);
      shiftConsoleActions();
    };

    var stopDrag = function(e) {
      document.documentElement.removeEventListener('mousemove', doDrag, false);
      document.documentElement.removeEventListener('mouseup', stopDrag, false);
    };

    document.documentElement.addEventListener('mousemove', doDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
  }

  function closeContainer(ev) {
    container.parentNode.removeChild(container);
  }

  var shifted = false;
  function shiftConsoleActions() {
    if (consoleOuter.scrollHeight > consoleOuter.clientHeight) {
      var widthDiff = document.documentElement.clientWidth - consoleOuter.clientWidth;
      if (shifted || ! widthDiff) return;
      shifted = true;
      consoleActions.style.marginRight = widthDiff + 'px';
    } else if (shifted) {
      shifted = false;
      consoleActions.style.marginRight = '0px';
    }
  }

  // Initialize
  this.container = container;
  this.outer = consoleOuter;
  this.inner = findChild(this.outer, 'console-inner');
  this.clipboard = findChild(container, 'clipboard');
  this.newPromptBox();
  this.insertCss();

  findChild(container, 'resizer').addEventListener('mousedown', resizeContainer);
  findChild(consoleActions, 'close-button').addEventListener('click', closeContainer);
  consoleOuter.addEventListener('DOMNodeInserted', shiftConsoleActions);

  REPLConsole.currentSession = this;
};

// Add CSS styles dynamically. This probably doesnt work for IE <8.
REPLConsole.prototype.insertCss = function() {
  if (document.getElementById(styleElementId)) {
    return; // already inserted
  }
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = consoleStyleCss;
  style.id = styleElementId;
  document.getElementsByTagName('head')[0].appendChild(style);
};

REPLConsole.prototype.focus = function() {
  if (! this.focused) {
    this.focused = true;
    if (! hasClass(this.inner, "console-focus")) {
      addClass(this.inner, "console-focus");
    }
    this.scrollToBottom();
  }
};

REPLConsole.prototype.blur = function() {
  this.focused = false;
  removeClass(this.inner, "console-focus");
};

/**
 * Add a new empty prompt box to the console.
 */
REPLConsole.prototype.newPromptBox = function() {
  // Remove the caret from previous prompt display if any.
  if (this.promptDisplay) {
    this.removeCaretFromPrompt();
  }

  var promptBox = document.createElement('div');
  promptBox.className = "console-prompt-box";
  promptBox.innerHTML = promptBoxHtml;
  this.promptLabel = promptBox.getElementsByClassName('console-prompt-label')[0];
  this.promptDisplay = promptBox.getElementsByClassName('console-prompt-display')[0];
  // Render the prompt box
  this.setInput("");
  this.promptLabel.innerHTML = this.prompt;
  this.inner.appendChild(promptBox);
  this.scrollToBottom();
};

/**
 * Remove the caret from the prompt box,
 * mainly before adding a new prompt box.
 * For simplicity, just re-render the prompt box
 * with caret position -1.
 */
REPLConsole.prototype.removeCaretFromPrompt = function() {
  this.setInput(this._input, -1);
};

REPLConsole.prototype.setInput = function(input, caretPos) {
  if (typeof input === 'undefined') return; // keep value if input is undefined
  this._caretPos = caretPos === undefined ? input.length : caretPos;
  this._input = input;
  this.renderInput();
};

/**
 * Add some text to the existing input.
 */
REPLConsole.prototype.addToInput = function(val, caretPos) {
  caretPos = caretPos || this._caretPos;
  var before = this._input.substring(0, caretPos);
  var after = this._input.substring(caretPos, this._input.length);
  var newInput =  before + val + after;
  this.setInput(newInput, caretPos + val.length);
};

/**
 * Render the input prompt. This is called whenever
 * the user input changes, sometimes not very efficient.
 */
REPLConsole.prototype.renderInput = function() {
  // Clear the current input.
  removeAllChildren(this.promptDisplay);

  var promptCursor = document.createElement('span');
  promptCursor.className = "console-cursor";
  var before, current, after;

  if (this._caretPos < 0) {
    before = this._input;
    current = after = "";
  } else if (this._caretPos === this._input.length) {
    before = this._input;
    current = "\u00A0";
    after = "";
  } else {
    before = this._input.substring(0, this._caretPos);
    current = this._input.charAt(this._caretPos);
    after = this._input.substring(this._caretPos + 1, this._input.length);
  }

  this.promptDisplay.appendChild(document.createTextNode(before));
  promptCursor.appendChild(document.createTextNode(current));
  this.promptDisplay.appendChild(promptCursor);
  this.promptDisplay.appendChild(document.createTextNode(after));
};

REPLConsole.prototype.writeOutput = function(output) {
  if (this.autocomplete) return;
  var consoleMessage = document.createElement('pre');
  consoleMessage.className = "console-message";
  consoleMessage.innerHTML = escapeHTML(output);
  this.inner.appendChild(consoleMessage);
  this.newPromptBox();
  return consoleMessage;
};

REPLConsole.prototype.writeError = function(output) {
  if (this.autocomplete) return;
  var consoleMessage = this.writeOutput(output);
  addClass(consoleMessage, "error-message");
  return consoleMessage;
};

REPLConsole.prototype.onEnterKey = function() {
  var input = this._input;

  if(input != "" && input !== undefined) {
    this.commandStorage.addCommand(input);
  }

  this.commandHandle(input);
};

REPLConsole.prototype.onTabKey = function() {
  var input = this._input;
  var self = this;

  if (self.autocomplete) return;
  self.autocomplete = new Autocomplete([]);

  self.commandHandle("nil", function(ok, obj) {
    if (!ok) return self.autocomplete = false;
    self.autocomplete = new Autocomplete(obj['context'], self.getCurrentWord());
    self.inner.appendChild(self.autocomplete.view);
    self.autocomplete.onFinished(function(word) {
      self.swapCurrentWord(word);
      self.autocomplete = false;
    });
    self.scrollToBottom();
  });
};

REPLConsole.prototype.onNavigateHistory = function(offset) {
  var command = this.commandStorage.navigate(offset) || "";
  this.setInput(command);
};

/**
 * Handle control keys like up, down, left, right.
 */
REPLConsole.prototype.onKeyDown = function(ev) {
  if (this.autocomplete) {
    function check(self) {
      if (ev.keyCode === 9) { // TAB
        if (ev.shiftKey) {
          self.autocomplete.back();
        } else {
          self.autocomplete.next();
        }
        return true;
      } else if (ev.keyCode === 13) { // Enter
        self.autocomplete.finish();
        return true;
      } else if (ev.keyCode == 27) { // ESC
        self.autocomplete.cancel();
        return true;
      }
    }
    if (check(this)) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
  }

  switch (ev.keyCode) {
    case 9:
      // Tab
      this.onTabKey();
      ev.preventDefault();
      break;
    case 13:
      // Enter key
      this.onEnterKey();
      ev.preventDefault();
      break;
    case 80:
      // Ctrl-P
      if (! ev.ctrlKey) break;
    case 38:
      // Up arrow
      this.onNavigateHistory(-1);
      ev.preventDefault();
      break;
    case 78:
      // Ctrl-N
      if (! ev.ctrlKey) break;
    case 40:
      // Down arrow
      this.onNavigateHistory(1);
      ev.preventDefault();
      break;
    case 37:
      // Left arrow
      var caretPos = this._caretPos > 0 ? this._caretPos - 1 : this._caretPos;
      this.setInput(this._input, caretPos);
      ev.preventDefault();
      break;
    case 39:
      // Right arrow
      var length = this._input.length;
      var caretPos = this._caretPos < length ? this._caretPos + 1 : this._caretPos;
      this.setInput(this._input, caretPos);
      ev.preventDefault();
      break;
    case 8:
      // Delete
      this.deleteAtCurrent();
      if (this.autocomplete) this.autocomplete.refine(this.getCurrentWord(), false);
      ev.preventDefault();
      break;
    default:
      break;
  }

  if (ev.ctrlKey || ev.metaKey) {
    // Set focus to our clipboard in case they hit the "v" key
    this.clipboard.focus();
    if (ev.keyCode == 86) {
      // Pasting to clipboard doesn't happen immediately,
      // so we have to wait for a while to get the pasted text.
      var _this = this;
      setTimeout(function() {
        _this.addToInput(_this.clipboard.value);
        _this.clipboard.value = "";
        _this.clipboard.blur();
      }, 10);
    }
  }

  ev.stopPropagation();
};

/**
 * Handle input key press.
 */
REPLConsole.prototype.onKeyPress = function(ev) {
  // Only write to the console if it's a single key press.
  if (ev.ctrlKey || ev.metaKey) { return; }
  var keyCode = ev.keyCode || ev.which;
  this.insertAtCurrent(String.fromCharCode(keyCode));
  if (this.autocomplete) this.autocomplete.refine(this.getCurrentWord(), true);
  ev.stopPropagation();
  ev.preventDefault();
};

/**
 * Delete a character at the current position.
 */
REPLConsole.prototype.deleteAtCurrent = function() {
  if (this._caretPos > 0) {
    var caretPos = this._caretPos - 1;
    var before = this._input.substring(0, caretPos);
    var after = this._input.substring(this._caretPos, this._input.length);
    this.setInput(before + after, caretPos);
  }
};

/**
 * Insert a character at the current position.
 */
REPLConsole.prototype.insertAtCurrent = function(char) {
  var before = this._input.substring(0, this._caretPos);
  var after = this._input.substring(this._caretPos, this._input.length);
  this.setInput(before + char + after, this._caretPos + 1);
};

REPLConsole.prototype.swapCurrentWord = function(next) {
  function right(s, pos) {
    var x = s.indexOf(' ', pos);
    return x === -1 ? s.length : x;
  }

  function swap(s, pos) {
    return s.substr(0, s.lastIndexOf(' ', pos) + 1) + next + s.substr(right(s, pos))
  }

  if (!next) return;
  var swapped = swap(this._input, this._caretPos);
  this.setInput(swapped, this._caretPos + swapped.length - this._input.length);
};

REPLConsole.prototype.getCurrentWord = function() {
  return (function(s, pos) {
    var left = s.lastIndexOf(' ', pos);
    if (left === -1) left = 0;
    var right = s.indexOf(' ', pos)
    if (right === -1) right = s.length - 1;
    return s.substr(left, right - left + 1).replace(/^\s+|\s+$/g,'');
  })(this._input, this._caretPos);
};

REPLConsole.prototype.scrollToBottom = function() {
  this.outer.scrollTop = this.outer.scrollHeight;
};

// Change the binding of the console
REPLConsole.prototype.switchBindingTo = function(frameId, callback) {
  var url = this.getSessionUrl('trace');
  var params = "frame_id=" + encodeURIComponent(frameId);
  postRequest(url, params, callback);
};

/**
 * Install the console into the element with a specific ID.
 * Example: REPLConsole.installInto("target-id")
 */
REPLConsole.installInto = function(id, options) {
  var consoleElement = document.getElementById(id);

  options = options || {};

  for (var prop in consoleElement.dataset) {
    options[prop] = options[prop] || consoleElement.dataset[prop];
  }

  var replConsole = new REPLConsole(options);
  replConsole.install(consoleElement);
  return replConsole;
};

// This is to store the latest single session, and the stored session
// is updated by the REPLConsole#install() method.
// It allows to operate the current session from the other scripts.
REPLConsole.currentSession = null;

// This line is for the Firefox Add-on, because it doesn't have XMLHttpRequest as default.
// And so we need to require a module compatible with XMLHttpRequest from SDK.
REPLConsole.XMLHttpRequest = typeof XMLHttpRequest === 'undefined' ? null : XMLHttpRequest;

REPLConsole.request = function request(method, url, params, callback) {
  var xhr = new REPLConsole.XMLHttpRequest();

  xhr.open(method, url, true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  xhr.setRequestHeader("Accept", "fake");
  xhr.send(params);

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      callback(xhr);
    }
  };
};

// DOM helpers
function hasClass(el, className) {
  var regex = new RegExp('(?:^|\\s)' + className + '(?!\\S)', 'g');
  return el.className && el.className.match(regex);
}

function isNodeList(el) {
  return typeof el.length === 'number' &&
    typeof el.item === 'function';
}

function addClass(el, className) {
  if (isNodeList(el)) {
    for (var i = 0; i < el.length; ++ i) {
      addClass(el[i], className);
    }
  } else {
    el.className += " " + className;
  }
}

function removeClass(el, className) {
  var regex = new RegExp('(?:^|\\s)' + className + '(?!\\S)', 'g');
  el.className = el.className.replace(regex, '');
}

function removeAllChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function findChild(el, className) {
  for (var i = 0; i < el.childNodes.length; ++ i) {
    if (hasClass(el.childNodes[i], className)) {
      return el.childNodes[i];
    }
  }
}

function escapeHTML(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}

// XHR helpers
function postRequest() {
  REPLConsole.request.apply(this, ["POST"].concat([].slice.call(arguments)));
}

function putRequest() {
  REPLConsole.request.apply(this, ["PUT"].concat([].slice.call(arguments)));
}

if (typeof exports === 'object') {
  exports.REPLConsole = REPLConsole;
} else {
  window.REPLConsole = REPLConsole;
}
