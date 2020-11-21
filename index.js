import Base64 from './base64';
import axios from 'axios';


if (process.env.NODE_ENV === 'development') {
    const infraxysPort = process.env.INFRAXYS_PORT ? process.env.INFRAXYS_PORT : 8444;
    const infraxysUrl = `http://localhost:${infraxysPort/`
} else {
    const infraxysUrl = '/oauth_';
}

let statusCallback;

const setStatusCallback = callback => {
  statusCallback = callback;
};

const setStatusMessage = message => {
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
  axios.post(url, base64Contents).then(response => {
    return 'File pushed';
  });
};

const followAction = (workflowRunGuid, actionRunnerGuid) => {
  const apiUrl = `${infraxysUrl}api/v1/actions/stream2/${workflowRunGuid}/${actionRunnerGuid}`;
  const evtSource = new EventSource(apiUrl);

  const processText = text => {
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

  evtSource.onmessage = event => {
    var text = Base64.decode(event.data);
    processText(text);

    evtSource.onerror = event => {
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

export {
  setStatusCallback,
  getCachedProjectFile,
  triggerAction,
  runAction,
  uploadFileToProjectCache,
  followAction,
};
