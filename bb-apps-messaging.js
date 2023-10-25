var ChannelType;
(function (ChannelType) {
    ChannelType[ChannelType["PUB_SUB"] = 0] = "PUB_SUB";
    ChannelType[ChannelType["BASIC_CHANNEL"] = 1] = "BASIC_CHANNEL";
    ChannelType[ChannelType["REQUEST"] = 2] = "REQUEST";
})(ChannelType || (ChannelType = {}));
var BasicChannelEvent;
(function (BasicChannelEvent) {
    BasicChannelEvent[BasicChannelEvent["CHANNEL_READY"] = 0] = "CHANNEL_READY";
    BasicChannelEvent[BasicChannelEvent["PARTICIPANT_LEFT"] = 1] = "PARTICIPANT_LEFT";
})(BasicChannelEvent || (BasicChannelEvent = {}));
class ChannelTypeValues {
    PUB_SUB = ChannelType.PUB_SUB;
    REQUEST = ChannelType.REQUEST;
    BASIC_CHANNEL = ChannelType.BASIC_CHANNEL;
}
class BasicChannelEventValues {
    CHANNEL_READY = BasicChannelEvent.CHANNEL_READY;
    PARTICIPANT_LEFT = BasicChannelEvent.PARTICIPANT_LEFT;
}

function isBBEnvAvailable() {
    return !!(window["bb"] &&
        window["bb"]["apps"] &&
        window["bb"]["apps"]["app"] &&
        window["bb"]["apps"]["event"]);
}
function checkBBEnv() {
    if (!isBBEnvAvailable())
        throw new Error("Bloomberg App Environment Not Available");
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

class PubSub {
    _sender;
    _sessionId;
    _topic;
    _accessInfo;
    _channelId;
    _subIds;
    constructor(sender, sessionId, topic, channelId) {
        checkBBEnv();
        this._subIds = [];
        this._sender = sender;
        this._sessionId = sessionId;
        this._topic = topic;
        this._channelId = channelId;
        this._accessInfo = {
            channelType: "pubsub",
            channelSession: this._sessionId,
            channelTopic: this._topic
        };
    }
    publish(msg) {
        return new Promise((resolve, reject) => {
            checkBBEnv();
            const content = JSON.stringify({ msg: msg || null, sender: this._sender });
            window.bb.apps.event.publish(this._sessionId, this._topic, content, this._accessInfo, this._channelId, () => {
                resolve();
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
    subscribe(callback) {
        return new Promise((resolve, reject) => {
            checkBBEnv();
            window.bb.apps.event.register(this._sessionId, this._topic, (msg) => {
                let content = null;
                try {
                    content = JSON.parse(msg);
                }
                catch (err) {
                    content = err;
                }
                callback(content.sender, content.msg);
            }, this._accessInfo, this._channelId, (subId) => {
                this._subIds.push(subId);
                resolve(subId);
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
    unsubscribe(subId) {
        return new Promise((resolve, reject) => {
            checkBBEnv();
            window.bb.apps.event.unregister(subId, () => {
                const index = this._subIds.indexOf(subId);
                if (index >= 0)
                    this._subIds.splice(index, 1);
                resolve();
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
    unsubscribeAll() {
        return new Promise(async (resolve, reject) => {
            try {
                checkBBEnv();
                const promises = this._subIds
                    .slice(0)
                    .map(subId => this.unsubscribe(subId));
                await Promise.all(promises);
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
}

class BasicChannel {
    _sender;
    _sessionId;
    _topic;
    _accessInfo;
    _channelId;
    _subId;
    ["BasicChannelEvent"] = new BasicChannelEventValues();
    constructor(sender, sessionId, topic, channelId) {
        checkBBEnv();
        this._sessionId = ((sender.progId < sessionId) || (sender.appId === sessionId)) ? sender.progId + "-" + sessionId : sessionId + "-" + sender.progId;
        this._subId = undefined;
        this._sender = sender;
        this._topic = topic;
        this._channelId = channelId;
        this._accessInfo = {
            channelType: "basic-channel",
            channelSession: sessionId,
            channelTopic: topic
        };
    }
    send(msg) {
        return new Promise(async (resolve, reject) => {
            try {
                checkBBEnv();
                if (this._subId === undefined || this._subId === null) {
                    throw new Error("You must set a handler for receiving messages before sending.");
                }
                let chanInfo = await this.getChannelInfo();
                if (!chanInfo.isReady) {
                    throw new Error("Channel is not ready. Please wait for other participant to join this channel.");
                }
                const content = JSON.stringify({ msg: msg === undefined ? null : msg, sender: this._sender });
                window.bb.apps.event.publish(this._sessionId, this._topic, content, this._accessInfo, this._channelId, () => {
                    resolve();
                }, (errCode, errMsg) => {
                    reject(new Error(errMsg));
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    receive(handler, basicChannelEventHandler) {
        return new Promise(async (resolve, reject) => {
            try {
                checkBBEnv();
                const oldSubId = this._subId;
                let chanInfo = { isReady: false };
                if (handler) {
                    chanInfo = await this._register(handler, basicChannelEventHandler);
                }
                if (oldSubId !== undefined) {
                    await this._unregister(oldSubId, handler === undefined);
                }
                resolve(chanInfo);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    getChannelInfo() {
        return new Promise((resolve, reject) => {
            checkBBEnv();
            window.bb.apps.event.getTopicInfo(this._sessionId, this._topic, this._accessInfo, this._channelId, (channelInfo) => {
                resolve({ isReady: channelInfo.isReady });
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
    _register(handler, basicChannelEventHandler) {
        return new Promise((resolve, reject) => {
            window.bb.apps.event.registerEx(this._sessionId, this._topic, (msg) => {
                let content = null;
                try {
                    content = JSON.parse(msg);
                }
                catch (err) {
                    content = err;
                }
                handler(content.sender, content.msg);
            }, this._accessInfo, this._channelId, {
                isClosedEnd: true,
                isOwner: false,
                noEcho: true,
                numOfParticipants: 2,
                openMode: "OPEN_ALWAYS"
            }, (eventType) => {
                let chanEvent = null;
                switch (eventType) {
                    case "TOPIC_READY": {
                        chanEvent = BasicChannelEvent.CHANNEL_READY;
                        break;
                    }
                    case "LEAVE": {
                        chanEvent = BasicChannelEvent.PARTICIPANT_LEFT;
                        break;
                    }
                }
                if (chanEvent !== null && basicChannelEventHandler) {
                    basicChannelEventHandler(chanEvent);
                }
            }, (subId, channelInfo) => {
                this._subId = subId;
                resolve({ isReady: channelInfo.isReady });
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
    _unregister(subId, resetSubId) {
        return new Promise((resolve, reject) => {
            window.bb.apps.event.unregister(subId, () => {
                if (resetSubId) {
                    this._subId = undefined;
                }
                resolve();
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
}

class Request {
    _sender;
    _sessionId;
    _topic;
    _accessInfo;
    _msgIdPrefix;
    _channelId;
    _subId;
    _pendingReq;
    _handler = null;
    _channelEventsHandler = null;
    _msgId;
    _isOwner;
    constructor(sender, sessionId, topic, channelId) {
        checkBBEnv();
        this._sessionId = "__REQUEST__" + sessionId;
        this._sender = sender;
        this._topic = topic;
        this._pendingReq = {};
        this._msgId = 0;
        this._msgIdPrefix = uuid();
        this._isOwner = false;
        this._channelId = channelId;
        this._accessInfo = {
            channelType: "request",
            channelSession: sessionId,
            channelTopic: topic
        };
    }
    request(request) {
        return new Promise(async (resolve, reject) => {
            try {
                checkBBEnv();
                await this._subscribe(false);
                await this._sendRequest(request);
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    requestWithResponse(request, timeout) {
        return new Promise(async (resolve, reject) => {
            let msgId = undefined;
            try {
                checkBBEnv();
                await this._subscribe(false);
                msgId = this._msgIdPrefix + ":" + (++this._msgId);
                const pending = { resolve, reject, timer: 0 };
                this._pendingReq[msgId] = pending;
                pending.timer = (timeout && timeout > 0) ? window.setTimeout(() => {
                    const pendReq = this._pendingReq[msgId];
                    if (pendReq) {
                        delete this._pendingReq[msgId];
                        pendReq.reject(new Error("Timeout"));
                    }
                }, timeout) : 0;
                await this._sendRequest(request, msgId);
            }
            catch (err) {
                const pendReq = this._pendingReq[msgId];
                if (pendReq) {
                    delete this._pendingReq[msgId];
                    window.clearTimeout(pendReq.timer);
                }
                reject(err);
            }
        });
    }
    onRequest(handler) {
        if (handler) {
            if (this._isOwner || this._subId === undefined) {
                this._handler = handler;
                return this._subscribe(true);
            }
        }
        else if (this._isOwner) {
            this._handler = null;
            return this._closeChannel();
        }
        throw new Error("Only the channel owner can set requests handler for this channel.");
    }
    onChannelClosed(onCloseEventHandler) {
        this._channelEventsHandler = onCloseEventHandler || null;
    }
    _subscribe(isOwner) {
        return new Promise((resolve, reject) => {
            if (this._subId !== undefined)
                return resolve();
            window.bb.apps.event.registerEx(this._sessionId, this._topic, (msg) => {
                let msgContent = null;
                try {
                    msgContent = JSON.parse(msg);
                }
                catch (err) {
                    msgContent = err;
                }
                if (msgContent.msg.response) {
                    const pendReq = this._pendingReq[msgContent.msg.id];
                    if (pendReq) {
                        delete this._pendingReq[msgContent.msg.id];
                        if (pendReq.timer)
                            window.clearTimeout(pendReq.timer);
                        pendReq.resolve(msgContent.msg.response);
                    }
                }
                else {
                    if (this._handler) {
                        this._handler(msgContent.sender, msgContent.msg.content, msgContent.msg.id ? async (response) => {
                            return await this._sendRequest(response, msgContent.msg.id, true);
                        } : undefined);
                    }
                }
            }, this._accessInfo, this._channelId, {
                isClosedEnd: false,
                isOwner: isOwner,
                noEcho: true,
                numOfParticipants: 0,
                openMode: isOwner ? "CREATE_NEW" : "OPEN_EXISTING"
            }, async (eventType) => {
                if (eventType === "TOPIC_CLOSE") {
                    if (this._subId) {
                        await this._unregister(this._subId, true);
                    }
                    if (this._channelEventsHandler) {
                        this._channelEventsHandler();
                    }
                }
            }, (subId, channelInfo) => {
                this._subId = subId;
                this._isOwner = isOwner;
                resolve();
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
    _sendRequest(content, msgId, isResponse) {
        return new Promise((resolve, reject) => {
            let msgContent = { msg: {}, sender: this._sender };
            if (msgId) {
                msgContent.msg.id = msgId;
            }
            if (isResponse) {
                msgContent.msg.response = (content === undefined ? null : content);
            }
            else {
                msgContent.msg.content = (content === undefined ? null : content);
            }
            window.bb.apps.event.publish(this._sessionId, this._topic, JSON.stringify(msgContent), this._accessInfo, this._channelId, () => {
                resolve();
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
    _closeChannel() {
        return new Promise((resolve, reject) => {
            if (this._subId !== undefined) {
                window.bb.apps.event.closeTopic(this._subId, () => {
                    this._subId = undefined;
                    this._isOwner = false;
                    resolve();
                }, (errCode, errMsg) => {
                    reject(new Error(errMsg));
                });
            }
            else {
                resolve();
            }
        });
    }
    _unregister(subId, resetSubId) {
        return new Promise((resolve, reject) => {
            window.bb.apps.event.unregister(subId, () => {
                if (resetSubId)
                    this._subId = undefined;
                resolve();
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
}

function getSessionAndTopic(uri) {
    if ((!uri) || (!uri.trim) || !(uri = uri.trim()) || !(uri.length > 0)) {
        throw new Error("Invalid uri");
    }
    let session = undefined;
    let topic = uri.toUpperCase();
    if (uri.startsWith("//")) {
        const sEnd = uri.indexOf('/', 2);
        if (sEnd < 3) {
            throw new Error("Invalid uri");
        }
        session = uri.substr(2, sEnd - 2).trim().toUpperCase();
        topic = uri.substr(sEnd + 1).trim().toUpperCase();
    }
    return { session, topic };
}
class GlobalMessaging {
    appId;
    progId;
    channelId;
    ["ChannelType"] = new ChannelTypeValues();
    constructor() {
        this.appId = "";
        this.progId = "";
        this.channelId = 0;
    }
    _init() {
        const doSyncInit = (resolve, reject) => {
            try {
                processInitData(window.bb.apps.event.init(), resolve, reject);
            }
            catch (err) {
                reject(new Error("Unable to initialize messaging api."));
            }
        };
        const processInitData = (initData, resolve, reject) => {
            try {
                const info = JSON.parse(initData);
                this.progId = info.progId.toUpperCase();
                this.appId = info.defaultSessionId.toUpperCase();
                resolve();
            }
            catch (err) {
                reject(new Error("Unable to initialize messaging api."));
            }
        };
        return new Promise((resolve, reject) => {
            if (this.progId && this.appId) {
                resolve();
            }
            else if (window.bb && window.bb.apps && window.bb.apps.event && window.bb.apps.event.initAsync) {
                window.bb.apps.event.initAsync(data => {
                    processInitData(data, resolve, reject);
                }, (errCode, errMsg) => {
                    reject(new Error("Unable to initialize messaging api."));
                });
            }
            else if (window.bb && window.bb.webview && window.bb.webview.ensureSynchronousInjectedFunction) {
                window.bb.webview.ensureSynchronousInjectedFunction(() => {
                    window.bb.webview._syncReady = true;
                    doSyncInit(resolve, reject);
                });
            }
            else {
                doSyncInit(resolve, reject);
            }
        });
    }
    async createChannel(type, uri) {
        await this._init();
        let { session, topic } = getSessionAndTopic(uri);
        session = session || this.appId;
        switch (type) {
            case ChannelType.PUB_SUB: {
                return new PubSub({ progId: this.progId, appId: this.appId }, session, topic, ++this.channelId);
            }
            case ChannelType.BASIC_CHANNEL: {
                return new BasicChannel({ progId: this.progId, appId: this.appId }, session, topic, ++this.channelId);
            }
            case ChannelType.REQUEST: {
                return new Request({ progId: this.progId, appId: this.appId }, session, topic, ++this.channelId);
            }
            default: {
                throw new Error("Wrong channel type.");
            }
        }
    }
}

var index = (function () {
    window.BB = window.BB || {};
    window.BB.Apps = window.BB.Apps || {};
    window.BB.Apps.Msg =
        window.BB.Apps.Msg || new GlobalMessaging();
    return window.BB.Apps.Msg;
})();

export { index as default };
