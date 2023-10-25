class Group {
    _name;
    _type;
    _lastUpdate = 0;
    _securityCacheExpiration = 15 * 1000;
    _securityCache = "";
    _terminalProxy;
    constructor(terminalProxy, name, type) {
        this._name = name;
        this._type = type;
        this._terminalProxy = terminalProxy;
    }
    get name() {
        return this._name;
    }
    get type() {
        return this._type;
    }
    getSecurity() {
        return new Promise((resolve, reject) => {
            this._terminalProxy.getAllGroups((groups) => {
                const group = groups.find((g) => g.name === this._name);
                if (!group) {
                    reject(new Error(`Group ${name} is not found.`));
                    return;
                }
                console.log("group", group);
                this._securityCache = group.security;
                this._lastUpdate = new Date().getTime();
                resolve(this._securityCache);
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
    getCachedSecurity() {
        return new Promise(async (resolve, reject) => {
            const currentTime = new Date().getTime();
            if ((!this._securityCache || !this._lastUpdate ||
                (currentTime - this._lastUpdate > this._securityCacheExpiration))) {
                await this.getSecurity();
            }
            resolve(this._securityCache);
        });
    }
    setSecurity(security, cookie) {
        return new Promise((resolve, reject) => {
            this._terminalProxy.setGroupSecurity(() => {
                this._securityCache = security;
                this._lastUpdate = new Date().getTime();
                resolve();
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            }, this._name, security, cookie);
        });
    }
}

function isBBEnvAvailable() {
    return !!(window["bb"] &&
        window["bb"]["apps"] &&
        window["bb"]["apps"]["app"] &&
        window["bb"]["apps"]["event"]);
}
function uuid() {
    const chars = "0123456789ABCDEF".split("");
    let uuid = [], rnd = Math.random, r;
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
    uuid[14] = "4";
    for (var i = 0; i < 36; i++) {
        if (!uuid[i]) {
            r = 0 | (rnd() * 16);
            uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r & 0xf];
        }
    }
    return uuid.join("");
}
function base64Encode(input) {
    const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    let i = 0;
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
        }
        else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
}

class WebSocketProxy {
    _webSocket;
    _seqNumber = 0;
    _isConnecting = false;
    _isConnected = false;
    _isRegistered = false;
    _sessionId = "";
    _queuedRequests = [];
    _pendingRequests = {};
    _minPortRange = 51800;
    _maxPortRange = 51820;
    _currentPort = 51800;
    _responseTimeout = 15000;
    _disconnectEventSubscriptions = {};
    _groupEventSubscriptions = {};
    sendRemoteMessage = (request, opType, onSuccess, onError) => {
        if (!this._isRegistered && !request.register) {
            this.sendRemoteMessage({ register: {} }, 12, null, console.error);
        }
        if (!this._sessionId)
            this._sessionId = `{${uuid()}}`;
        if (request.setGroupValue && !request.setGroupValue.cookie) {
            request.setGroupValue.cookie = this._sessionId;
        }
        if (request.subscribeGroupEvents) {
            const subId = request.subscribeGroupEvents.subId;
            delete request.subscribeGroupEvents.subId;
            onError = (args) => {
                delete this._groupEventSubscriptions[subId];
                if (onError)
                    onError(args);
            };
        }
        const msgObj = { sessionId: this._sessionId, correlationId: (++this._seqNumber), request: request };
        const strMsg = JSON.stringify(msgObj);
        const isEnveloped = opType > 12;
        const wrapper = isEnveloped ? {
            appId: msgObj.appId, sessionId: msgObj.sessionId, correlationId: msgObj.correlationId,
            payloadSchemaName: "ap3g_internal", payloadSchemaVersion: 2, payloadMsgType: opType,
            payload: base64Encode(strMsg)
        } : undefined;
        const envObj = {
            schemaName: isEnveloped ? "blp_lpad_msg" : "blp_remote_controller",
            schemaVersion: 2,
            message: isEnveloped ? JSON.stringify(wrapper) : strMsg
        };
        const requestCtx = { envelope: envObj, correlationId: msgObj.correlationId, expectResponse: true, onsuccess: onSuccess, onerror: onError };
        this._pendingRequests[msgObj.correlationId] = requestCtx;
        if (this._isConnected) {
            this.sendRequest(requestCtx);
        }
        else {
            this._queuedRequests.push(requestCtx);
            this.connect();
        }
    };
    addEventListener(callback) {
        const subId = Object.keys(this._groupEventSubscriptions).length + 1;
        this._groupEventSubscriptions[subId] = callback;
        return subId;
    }
    removeEventListener(subId) {
        delete this._groupEventSubscriptions[subId];
        return Object.keys(this._groupEventSubscriptions).length;
    }
    addDisconnectEventListener(callback) {
        const subId = Object.keys(this._disconnectEventSubscriptions).length + 1;
        this._disconnectEventSubscriptions[subId] = callback;
        return subId;
    }
    removeDisconnectEventListener(subId) {
        const countBefore = Object.keys(this._disconnectEventSubscriptions).length;
        delete this._disconnectEventSubscriptions[subId];
        const countAfter = Object.keys(this._disconnectEventSubscriptions).length;
        return countBefore !== countAfter;
    }
    sendRequest(requestCtx) {
        const msgText = JSON.stringify(requestCtx.envelope);
        if (this._webSocket) {
            this._webSocket.send(msgText);
        }
        if (!requestCtx.expectResponse) {
            delete this._pendingRequests[requestCtx.correlationId];
        }
        else {
            setTimeout(() => {
                if (this._pendingRequests[requestCtx.correlationId]) {
                    delete this._pendingRequests[requestCtx.correlationId];
                    if (requestCtx.onerror)
                        requestCtx.onerror(0, "Response Timeout");
                }
            }, this._responseTimeout);
        }
    }
    connect() {
        try {
            if (this._isConnecting)
                return;
            this._isConnecting = true;
            this._webSocket = new WebSocket("ws://localhost:" + this._currentPort, "terminal_api");
            this._webSocket.onopen = this.onWebSocketOpen.bind(this);
            this._webSocket.onmessage = this.onWebSocketMessage.bind(this);
            this._webSocket.onclose = this.onWebSocketClose.bind(this);
            this._webSocket.onerror = this.onWebSocketError.bind(this);
        }
        catch (exception) {
            this._webSocket = undefined;
            this.cancelPendingRequests("WebSocket Exception " + exception);
            console.error(exception);
        }
    }
    cancelPendingRequests(error) {
        this._isConnected = false;
        this._isConnecting = false;
        this._isRegistered = false;
        this._sessionId = "";
        for (let key in this._pendingRequests) {
            const pendingInfo = this._pendingRequests[key];
            if (pendingInfo && pendingInfo.onerror)
                pendingInfo.onerror(0, error);
        }
        this._pendingRequests = {};
    }
    onWebSocketClose(ev) {
        console.log("WebSocket Closed; Reason: " + ev.reason + ", Code: " + ev.code + ", WasClean: " + ev.wasClean);
        if (this._isConnected) {
            const details = {};
            if (ev && ev.reason !== undefined)
                details.reason = ev.reason;
            if (ev && ev.code !== undefined)
                details.code = ev.code;
            if (ev && ev.wasClean !== undefined)
                details.wasClean = ev.wasClean;
            this._currentPort = this._minPortRange;
            this.cancelPendingRequests({ status: "error", message: "Connection Closed", details: details });
            for (let cookie in this._disconnectEventSubscriptions) {
                const callback = this._disconnectEventSubscriptions[cookie];
                if (callback)
                    callback(cookie);
            }
        }
    }
    onWebSocketError() {
        console.log("WebSocket Error;  readyState: " + (this._webSocket && this._webSocket.readyState));
        this._isConnecting = false;
        if (this._currentPort < this._maxPortRange) {
            this._currentPort += 1;
            this.connect();
        }
        else {
            this._currentPort = this._minPortRange;
            const details = { readyState: this._webSocket && this._webSocket.readyState };
            this.cancelPendingRequests({ status: "error", message: "Connection Error", details: details });
        }
    }
    onWebSocketOpen() {
        this._isConnected = true;
        this._isConnecting = false;
        while (this._queuedRequests.length > 0) {
            this.sendRequest(this._queuedRequests.shift());
        }
    }
    onWebSocketMessage(ev) {
        var data = ev && ev.data ? ev.data : "null";
        var env = JSON.parse(data);
        var msg = env ? JSON.parse(env.message) : null;
        var requestCtx = msg && msg.response ? this._pendingRequests[msg.correlationId] : null;
        if (requestCtx) {
            delete this._pendingRequests[msg.correlationId];
        }
        this.processResponse(requestCtx, msg.response);
    }
    getGroupInfo(rawGroup) {
        if (!rawGroup)
            return {};
        return { name: rawGroup.name, type: rawGroup.type, security: rawGroup.type === "security" && rawGroup.value ? rawGroup.value : undefined };
    }
    processResponse(requestCtx, response) {
        if (response.success) {
            if (requestCtx.onsuccess)
                requestCtx.onsuccess();
        }
        else if (response.registrationComplete) {
            this._isRegistered = true;
            console.log("Registration Complete; Session: " + this._sessionId);
            if (requestCtx.onsuccess)
                requestCtx.onsuccess();
        }
        else if (response.getAllGroups) {
            const group = response.getAllGroups.group;
            if (requestCtx.onsuccess) {
                requestCtx.onsuccess(group ? group.map(this.getGroupInfo) : []);
            }
        }
        else if (response.groupValue) {
            if (requestCtx.onsuccess)
                requestCtx.onsuccess(this.getGroupInfo(response.groupValue.group));
        }
        else if (response.groupEvent) {
            if (response.groupEvent.valueChanged) {
                const groups = response.groupEvent.valueChanged.groups;
                const groupInfoArray = groups ? groups.map(this.getGroupInfo) : [];
                const cookie = response.groupEvent.valueChanged.cookie === this._sessionId ? undefined : response.groupEvent.valueChanged.cookie;
                for (let subtoken in this._groupEventSubscriptions) {
                    const callback = this._groupEventSubscriptions[subtoken];
                    if (callback) {
                        callback(groupInfoArray, cookie);
                    }
                }
            }
        }
        else if (requestCtx.onerror) {
            requestCtx.onerror(response.failure && response.failure.code || 0, response.failure ? `${response.failure.message} ${response.failure.humanMessage}` : "Unknown Response");
        }
    }
}

class WebSocketTerminalConnect {
    _webSocket = new WebSocketProxy();
    runFunction(onSuccess, onError, mnemonic, panel, security1, security2, tails, props) {
        let errorMessage = "";
        if (!mnemonic || !mnemonic.length)
            errorMessage = "Invalid Or Missing Parameter: mnemonic";
        else if (panel !== 1 && panel !== 2 && panel !== 3 && panel !== 4 && panel !== 5)
            errorMessage = "Invalid Or Missing Parameter: panel";
        if (errorMessage) {
            console.error("runFunctionInPanel error: " + errorMessage);
            if (onError)
                onError(0, errorMessage);
            return;
        }
        const runFunctionMessage = { runFunctionInPanel: { mnemonic, panel } };
        if (security1) {
            const securities = [];
            securities.push(security1);
            if (security2)
                securities.push(security2);
            runFunctionMessage.runFunctionInPanel.securities = securities;
        }
        if (tails)
            runFunctionMessage.runFunctionInPanel.tails = tails;
        if (props)
            runFunctionMessage.runFunctionInPanel.applicationProperties = props;
        this._webSocket.sendRemoteMessage(runFunctionMessage, 0, onSuccess, onError);
    }
    getAllGroups(onSuccess, onError) {
        this._webSocket.sendRemoteMessage({ getAllGroups: {} }, 13, onSuccess, onError);
    }
    getGroup(onSuccess, onError, name) {
        if (!name || !name.length) {
            const errorMessage = "Invalid Or Missing Parameter: name";
            console.error(errorMessage);
            if (onError)
                onError(0, errorMessage);
            return;
        }
        this._webSocket.sendRemoteMessage({ getGroupValue: { name } }, 15, onSuccess, onError);
    }
    setGroupSecurity(onSuccess, onError, name, security, cookie) {
        let errorMessage = "";
        if (!name || !name.length)
            errorMessage = "Invalid Or Missing Parameter: name";
        else if (!security || !security.length)
            errorMessage = "Invalid Or Missing Parameter: security";
        if (errorMessage) {
            console.error("setGroupContext error: " + errorMessage);
            if (onError)
                onError(0, errorMessage);
            return;
        }
        this._webSocket.sendRemoteMessage({ setGroupValue: { name, value: security, cookie } }, 14, onSuccess, onError);
    }
    subscribeGroupEvents(onSuccess, onError, callback) {
        if (!callback) {
            const errorMessage = "Invalid Or Missing Parameter: callback";
            console.error("subscribeGroupEvents error: " + errorMessage);
            if (onError)
                onError(0, errorMessage);
            return;
        }
        const subId = this._webSocket.addEventListener(callback);
        if (subId === 1) {
            this._webSocket.sendRemoteMessage({ subscribeGroupEvents: { subId } }, 16, () => {
                if (onSuccess)
                    onSuccess(subId);
            }, (error) => {
                if (onError)
                    onError(0, error);
            });
        }
        else {
            if (onSuccess)
                onSuccess(subId);
        }
    }
    unsubscribeGroupEvents(onSuccess, onError, subId) {
        if (!subId) {
            const errorMessage = "Invalid Or Missing Parameter: cookie";
            console.error("unsubscribeGroupEvents error: " + errorMessage);
            if (onError)
                onError(0, errorMessage);
            return;
        }
        const count = this._webSocket.removeEventListener(subId);
        if (count === 0) {
            this._webSocket.sendRemoteMessage({ unsubscribeGroupEvents: {} }, 17, onSuccess, onError);
        }
        else {
            if (onSuccess)
                onSuccess();
        }
    }
    subscribeDisconnectEvent(onSuccess, onError, callback) {
        if (!callback) {
            const errorMessage = "Invalid Or Missing Parameter: callback";
            console.error("subscribeDisconnectEvent error: " + errorMessage);
            if (onError)
                onError(0, errorMessage);
            return null;
        }
        const subId = this._webSocket.addDisconnectEventListener(callback);
        if (onSuccess)
            onSuccess(subId);
        return subId;
    }
    unsubscribeDisconnectEvent(onSuccess, onError, subId) {
        if (!subId) {
            const errorMessage = "Invalid Or Missing Parameter: cookie";
            console.error("unsubscribeDisconnectEvent error: " + errorMessage);
            if (onError)
                onError(0, errorMessage);
            return false;
        }
        if (!this._webSocket.removeDisconnectEventListener(subId)) {
            if (onError)
                onError(0, "Invalid Subscription");
            return false;
        }
        if (onSuccess)
            onSuccess();
        return true;
    }
}

class WebappTerminalConnect {
    runFunction = window.bb.apps.tc.runFunction;
    getGroup = window.bb.apps.tc.getGroup;
    setGroupSecurity = window.bb.apps.tc.setGroupSecurity;
    getAllGroups = window.bb.apps.tc.getAllGroups;
    subscribeGroupEvents = window.bb.apps.tc.subscribeGroupEvents;
    unsubscribeGroupEvents = window.bb.apps.tc.unsubscribeGroupEvents;
    subscribeDisconnectEvent(onSuccess, onError, callback) {
    }
    unsubscribeDisconnectEvent(onSuccess, onError, subId) {
    }
}

class GlobalTerminal {
    _terminalProxy;
    constructor(useWebSocket = !isBBEnvAvailable()) {
        this._terminalProxy = useWebSocket ? new WebSocketTerminalConnect() : new WebappTerminalConnect();
    }
    runFunction(mnemonic, panel, security1, security2, tails) {
        return new Promise((resolve, reject) => {
            this._terminalProxy.runFunction(resolve, (errCode, errMsg) => {
                reject(new Error(errMsg));
            }, mnemonic, panel, security1 || null, security2 || null, tails || null);
        });
    }
    getAllGroups() {
        return new Promise((resolve, reject) => {
            this._terminalProxy.getAllGroups((groups) => {
                resolve(Array.from(groups, this._helperSetGroupValues));
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
    getGroup(name) {
        return new Promise((resolve, reject) => {
            this._terminalProxy.getAllGroups((groups) => {
                const group = groups.find((g) => g.name === name);
                if (!group) {
                    reject(new Error(`Group ${name} is not found.`));
                    return;
                }
                resolve(this._helperSetGroupValues(group));
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
    subscribeGroupEvents(callback) {
        return new Promise((resolve, reject) => {
            this._terminalProxy.subscribeGroupEvents((subId) => {
                resolve(subId);
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            }, (group, cookie) => {
                callback(this._helperSetGroupValues(group), cookie);
            });
        });
    }
    unsubscribeGroupEvents(subId) {
        return new Promise((resolve, reject) => {
            this._terminalProxy.unsubscribeGroupEvents(() => {
                resolve();
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            }, subId);
        });
    }
    _helperSetGroupValues = (rawGroup) => {
        const newGroup = new Group(this._terminalProxy, rawGroup.name, rawGroup.type);
        newGroup._securityCache = rawGroup.security;
        newGroup._lastUpdate = new Date().getTime();
        return newGroup;
    };
}

var index = (function () {
    window.BB = window.BB || {};
    window.BB.Apps = window.BB.Apps || {};
    window.BB.Apps.Terminal = window.BB.Apps.Terminal || new GlobalTerminal();
    return window.BB.Apps.Terminal;
})();

export { index as default };
