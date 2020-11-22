import axios from 'axios';

let infraxysUrl;
if (process.env.NODE_ENV === 'development') {
  const infraxysPort = process.env.INFRAXYS_PORT
    ? process.env.INFRAXYS_PORT
    : 8444;
  infraxysUrl = `http://localhost:${infraxysPort}/`;
} else {
  infraxysUrl = '/oauth_';
}

let statusCallback;

const setStatusCallback = (callback) => {
  statusCallback = callback;
};

const setStatusMessage = (message) => {
  if (statusCallback !== undefined) statusCallback(message);
};

const getCachedProjectFile = async (projectGuid, filePath) => {
  const url = `${infraxysUrl}api/v1/cache/projects/${projectGuid}/${filePath}`;
  const response = await axios.get(url, {
    asynchronous: false,
    timeoutSeconds: 600,
    returnLog: false,
  });
  return response;
};

const triggerAction = async (
  actionAlias,
  actionArguments = undefined,
  timeoutSeconds = 600,
  returnLog = false
) => {
  return await _executeAction(
    actionAlias,
    actionArguments,
    true,
    timeoutSeconds,
    returnLog
  );
};

const runAction = async (
  actionAlias,
  actionArguments = undefined,
  timeoutSeconds = 600,
  returnLog = false
) => {
  return await _executeAction(
    actionAlias,
    actionArguments,
    false,
    timeoutSeconds,
    returnLog
  );
};

const _executeAction = async (
  actionAlias,
  actionArguments,
  asynchronous,
  timeoutSeconds,
  returnLog
) => {
  const url = `${infraxysUrl}api/v1/actions/start/${actionAlias}`;
  const args = {
    asynchronous: asynchronous,
    timeoutSeconds: timeoutSeconds,
    returnLog: returnLog,
    arguments: actionArguments,
  };
  return await axiosPost(url, asynchronous, args, timeoutSeconds, returnLog);
};

const axiosPost = async (url, data = undefined) => {
  const response = await axios.post(url, data);
  return response;
};

const uploadFileToProjectCache = async (projectGuid, filePath, contents) => {
  const base64Contents = Base64.encode(contents);
  const url = `${infraxysUrl}api/v1/cache/projects/${projectGuid}/${filePath}`;
  axios.post(url, base64Contents).then((response) => {
    return 'File pushed';
  });
};

const followAction = (workflowRunGuid, actionRunnerGuid) => {
  const apiUrl = `${infraxysUrl}api/v1/actions/stream2/${workflowRunGuid}/${actionRunnerGuid}`;
  const evtSource = new EventSource(apiUrl);

  const processText = (text) => {
    const startTag = '<CLIENT-FEEDBACK>';
    const endTag = '</CLIENT-FEEDBACK>';
    if (!text.includes('<CLIENT-FEEDBACK>')) return;

    const posStart = text.indexOf(startTag) + startTag.length;
    const posEnd = text.indexOf(endTag);
    if (posEnd === -1) {
      setStatusMessage('No end tag for CLIENT-FEEDBACK found.');
      return;
    }
    const trimmedText = text.substring(posStart, posEnd).trim();
    console.log(`-----${trimmedText}----`);

    if (trimmedText.startsWith('{') && trimmedText.endsWith('}')) {
      const clientJson = JSON.parse(trimmedText);
      const messageType = clientJson['type'];
      console.log(`Message type: ${messageType}`);
      if (messageType === 'STATUS-MESSAGE') {
        setStatusMessage(clientJson['message']);
      }
    }
  };

  console.log(`Connecting to stream ${apiUrl}`);

  evtSource.onmessage = (event) => {
    var text = Base64.decode(event.data);
    processText(text);

    evtSource.onerror = (event) => {
      switch (event.target.readyState) {
        case EventSource.OPEN:
          setStatusMessage('EventSource failed:', event);
          break;

        case EventSource.CONNECTING:
          break;

        case EventSource.CLOSED:
          break;

        default:
          break;
      }
    };
  };
};

const Base64 = () => {
  const _keyStr =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  function encode(input) {
    var output = '';
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    input = Base64._utf8_encode(input);

    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output =
        output +
        _keyStr.charAt(enc1) +
        _keyStr.charAt(enc2) +
        _keyStr.charAt(enc3) +
        _keyStr.charAt(enc4);
    }
    return output;
  }

  function decode(input) {
    var output = '';
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    // eslint-disable-next-line no-useless-escape
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

    while (i < input.length) {
      enc1 = _keyStr.indexOf(input.charAt(i++));
      enc2 = _keyStr.indexOf(input.charAt(i++));
      enc3 = _keyStr.indexOf(input.charAt(i++));
      enc4 = _keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output = output + String.fromCharCode(chr1);

      if (enc3 !== 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 !== 64) {
        output = output + String.fromCharCode(chr3);
      }
    }
    output = Base64._utf8_decode(output);
    return output;
  }

  function _utf8_encode(string) {
    string = string.replace(/\r\n/g, '\n');
    var utftext = '';

    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if (c > 127 && c < 2048) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  }

  function _utf8_decode(utftext) {
    var string = '';
    var i = 0;
    var c = 0;
    var c2 = 0;
    var c3 = 0;

    while (i < utftext.length) {
      c = utftext.charCodeAt(i);

      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      } else if (c > 191 && c < 224) {
        c2 = utftext.charCodeAt(i + 1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utftext.charCodeAt(i + 1);
        c3 = utftext.charCodeAt(i + 2);
        string += String.fromCharCode(
          ((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)
        );
        i += 3;
      }
    }
    return string;
  }
};

const defaults = {
  setStatusCallback,
  getCachedProjectFile,
  triggerAction,
  runAction,
  uploadFileToProjectCache,
  followAction,
};

export default defaults;
