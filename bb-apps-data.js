var EventType;
(function (EventType) {
    EventType["Trade"] = "TRADE";
    EventType["Bid"] = "BID";
    EventType["Ask"] = "ASK";
    EventType["BidBest"] = "BID_BEST";
    EventType["AskBest"] = "ASK_BEST";
    EventType["MidPrice"] = "MID_PRICE";
    EventType["AtTrade"] = "AT_TRADE";
    EventType["BestBid"] = "BEST_BID";
    EventType["BestAsk"] = "BEST_ASK";
})(EventType || (EventType = {}));
var Periodicity;
(function (Periodicity) {
    Periodicity["Daily"] = "DAILY";
    Periodicity["Weekly"] = "WEEKLY";
    Periodicity["Monthly"] = "MONTHLY";
    Periodicity["Quarterly"] = "QUARTERLY";
    Periodicity["SemiAnnually"] = "SEMI_ANNUALLY";
    Periodicity["Yearly"] = "YEARLY";
})(Periodicity || (Periodicity = {}));
var BlpapiServiceType;
(function (BlpapiServiceType) {
    BlpapiServiceType["RefData"] = "//blp/refdata";
    BlpapiServiceType["Instruments"] = "//blp/instruments";
    BlpapiServiceType["ApiFields"] = "//blp/apiflds";
    BlpapiServiceType["MktData"] = "//blp/mktdata";
    BlpapiServiceType["MktVWap"] = "//blp/mktvwap";
    BlpapiServiceType["MktBar"] = "//blp/mktbar";
    BlpapiServiceType["PortfolioList"] = "//blp/security-list";
})(BlpapiServiceType || (BlpapiServiceType = {}));
var BlpapiRequestType;
(function (BlpapiRequestType) {
    BlpapiRequestType["ReferenceData"] = "ReferenceDataRequest";
    BlpapiRequestType["HistoricalData"] = "HistoricalDataRequest";
    BlpapiRequestType["IntradayBar"] = "IntradayBarRequest";
    BlpapiRequestType["IntradayTick"] = "IntradayTickRequest";
    BlpapiRequestType["PortfolioData"] = "PortfolioDataRequest";
    BlpapiRequestType["FieldList"] = "FieldListRequest";
    BlpapiRequestType["FieldInfo"] = "FieldInfoRequest";
    BlpapiRequestType["FieldSearch"] = "FieldSearchRequest";
    BlpapiRequestType["CategorizedFieldSearch"] = "CategorizedFieldSearchRequest";
    BlpapiRequestType["PortfolioList"] = "listRequest";
})(BlpapiRequestType || (BlpapiRequestType = {}));
var CellType;
(function (CellType) {
    CellType["FormulaType"] = "formula";
    CellType["StringType"] = "string";
    CellType["BooleanType"] = "boolean";
    CellType["TimeType"] = "time";
    CellType["DateType"] = "date";
    CellType["DateTimeType"] = "datetime";
    CellType["DoubleType"] = "double";
    CellType["IntegerType"] = "integer";
})(CellType || (CellType = {}));

class BlpapiDatetime {
    year;
    month;
    day;
    hours;
    minutes;
    seconds;
    milliseconds;
    picoseconds;
    __blp_object_type_datetime__ = true;
    static format(n) {
        return n < 10 ? "0" + n : n.toString();
    }
    constructor(year, month, day, hours, minutes, seconds, milliseconds, picoseconds) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.hours = hours || 0;
        this.minutes = minutes || 0;
        this.seconds = seconds || 0;
        this.milliseconds = milliseconds || 0;
        this.picoseconds = picoseconds || 0;
    }
    toString() {
        return (this.hours || this.minutes || this.seconds) ? this.toDateTimeString() : this.toDateString();
    }
    toDateString() {
        return `${this.year}${BlpapiDatetime.format(this.month)}${BlpapiDatetime.format(this.day)}`;
    }
    toDateTimeString() {
        return `${this.year}-${BlpapiDatetime.format(this.month)}-${BlpapiDatetime.format(this.day)}T${BlpapiDatetime.format(this.hours)}:${BlpapiDatetime.format(this.minutes)}:${BlpapiDatetime.format(this.seconds)}`;
    }
}

const BLPAPI_DATA_META_STORAGE = Symbol("BlpapiData:Meta");
class BlpapiData {
    [BLPAPI_DATA_META_STORAGE];
    constructor(data) {
        Object.keys(data).forEach(key => {
            this[key] = data[key];
        });
        this[BLPAPI_DATA_META_STORAGE] = new Map();
    }
    static CALLBACK_MSG_PROPS = {
        subscription: Symbol("subscription"),
        subscriptionString: Symbol("subscriptionString"),
        cookie: Symbol("cookie"),
    };
    static fromBlpapiMessage(eventType, msg) {
        const data = new BlpapiData(msg.data);
        data.meta("eventType", eventType);
        data.meta("messageType", msg.messageType);
        data.meta("correlationId", msg.correlationId);
        data.meta("timeReceived", msg.timeReceived);
        data.meta("timeDelivered", msg.timeDelivered);
        for (const name of Object.keys(BlpapiData.CALLBACK_MSG_PROPS)) {
            data.meta(name, msg[BlpapiData.CALLBACK_MSG_PROPS[name]]);
        }
        return data;
    }
    meta(key, value) {
        if (value === undefined) {
            if (key === undefined) {
                return Array.from(this[BLPAPI_DATA_META_STORAGE].keys());
            }
            else if (typeof key === "string") {
                return this[BLPAPI_DATA_META_STORAGE].get(key);
            }
            else {
                const metaFieldMap = this[BLPAPI_DATA_META_STORAGE];
                const result = [];
                for (const k of key) {
                    result.push(metaFieldMap.get(k));
                }
                return result;
            }
        }
        else {
            if (typeof key !== "string") {
                throw new Error("Non-string keys are not supported.");
            }
            this[BLPAPI_DATA_META_STORAGE].set(key, value);
        }
    }
}

var ClosingPhases;
(function (ClosingPhases) {
    ClosingPhases[ClosingPhases["notClosing"] = 0] = "notClosing";
    ClosingPhases[ClosingPhases["startedClosing"] = 1] = "startedClosing";
    ClosingPhases[ClosingPhases["startedFinishingClosing"] = 2] = "startedFinishingClosing";
    ClosingPhases[ClosingPhases["closed"] = 3] = "closed";
})(ClosingPhases || (ClosingPhases = {}));
class BlpapiDataChannel {
    _receiver = null;
    _meta = new Map();
    _unopenReceiver;
    _isClosedPromise;
    _resolveIsClosedPromise = null;
    _closingPhase = ClosingPhases.notClosing;
    constructor(receiver) {
        if (typeof receiver !== "function") {
            throw new Error("receiver should be a generator function");
        }
        this._unopenReceiver = receiver;
        this._isClosedPromise = new Promise((resolve) => {
            this._resolveIsClosedPromise = resolve;
        });
    }
    get waitClosed() {
        return this._isClosedPromise;
    }
    open(...args) {
        if (!this._unopenReceiver) {
            this.ensureOpen("can't open");
            return false;
        }
        this._receiver = this._unopenReceiver.apply(this, args);
        this._unopenReceiver = null;
        this.send();
        return true;
    }
    isOpen() {
        return (!!this._receiver) && (this._closingPhase < ClosingPhases.startedClosing);
    }
    ensureOpen(msg, ...args) {
        if (this.isOpen()) {
            return;
        }
        const what = this._unopenReceiver ? "is not yet open" : (this._closingPhase < ClosingPhases.closed ? "has started closing" : "is already closed");
        msg = msg ? ` - ${msg}` : "";
        console.error(`BlpapiDataChannel ${what}${msg}`, ...args);
        throw new Error(`BlpapiDataChannel ${what}`);
    }
    close() {
        if (this._startClosing()) {
            this._finishClosing();
            return true;
        }
        return false;
    }
    _startClosing() {
        if (this._closingPhase >= ClosingPhases.startedClosing)
            return false;
        this._closingPhase = ClosingPhases.startedClosing;
        this.send(null);
        return true;
    }
    _finishClosing() {
        if (this._closingPhase >= ClosingPhases.startedFinishingClosing)
            return false;
        this._closingPhase = ClosingPhases.startedFinishingClosing;
        try {
            if (this._receiver && typeof this._receiver.return === "function") {
                this._receiver.return();
            }
        }
        catch (e) {
            console.error("exception from `receiver`.return() ignored", e);
        }
        finally {
            this._receiver = null;
        }
        if (this._resolveIsClosedPromise) {
            const resolve = this._resolveIsClosedPromise;
            this._resolveIsClosedPromise = null;
            resolve(this);
        }
        this._closingPhase = ClosingPhases.closed;
    }
    send(data) {
        if (data && !this._receiver) {
            this.ensureOpen("can't send");
        }
        try {
            var { done } = this._receiver ? this._receiver.next(data) : { done: true };
        }
        catch (e) {
            this._finishClosing();
            throw e;
        }
        if (done) {
            this._finishClosing();
        }
    }
    processBlpapiMessage(eventType, msg) {
        if (!this.isOpen())
            return false;
        this.send(BlpapiData.fromBlpapiMessage(eventType, msg));
        return (this._closingPhase < ClosingPhases.startedClosing);
    }
    meta(key, value) {
        if (value === undefined)
            return this._meta.get(key);
        else
            this._meta.set(key, value);
    }
}

class BlpapiResponseError extends Error {
    code;
    source;
    category;
    subcategory;
    constructor(e) {
        super(e.message || "An unspecified error occurred");
        this.code = e.code;
        this.source = e.source;
        this.category = e.category;
        this.subcategory = e.subcategory;
    }
}

class ControlDataSource {
    _token;
    _blpapiSession;
    _channel;
    constructor(session, receiver) {
        if (!session) {
            throw new Error("session is a mandatory parameter");
        }
        this._blpapiSession = session;
        this._channel = new BlpapiDataChannel(receiver);
        this._channel.open(this);
        this._token = this.demux.addHandler(this._channel.processBlpapiMessage.bind(this._channel));
    }
    get blpapiSession() {
        return this._blpapiSession;
    }
    get demux() {
        return this._blpapiSession._demux;
    }
    destroy() {
        if (this._token) {
            this.demux.removeHandler(this._token);
            this._token = null;
        }
        if (this._channel && this._channel.isOpen()) {
            this._channel.close();
            this._channel = null;
        }
    }
    subscribe(messagePatterns) {
        if (this._token) {
            this.demux.addPatterns(this._token, messagePatterns);
        }
    }
    unsubscribe(messagePatterns) {
        if (this._token) {
            this.demux.removePatterns(this._token, messagePatterns);
        }
    }
}

function isSymbol(x) {
    return typeof x === 'symbol'
        || typeof x === 'object' && Object.prototype.toString.call(x) === '[object Symbol]';
}
function createFulfillablePromise() {
    let resolve_, reject_;
    const promise = new Promise((resolve, reject) => {
        resolve_ = resolve;
        reject_ = reject;
    });
    promise.resolve = resolve_;
    promise.reject = reject_;
    if (promise.resolve === undefined || promise.reject === undefined) {
        throw new Error("failed to create a fulfillable promise");
    }
    return promise;
}
function getLogger(...params) {
    let args = [console, (new Date()).toISOString()];
    for (const a of arguments) {
        args = args.concat(a);
    }
    var method = "debug";
    return console[method].bind.apply(console[method], args);
}
function callbackPromise(func, ...args) {
    const x = { outerError: new Error() };
    return new Promise((resolve, reject) => {
        func.apply(null, [].concat(args, (...resolveArgs) => {
            delete x.outerError;
            resolve.apply(null, resolveArgs);
        }, (errCode, errMsg) => {
            let error = x.outerError;
            delete x.outerError;
            error.message = `${errCode}: ${errMsg}`;
            reject(error);
        }));
    });
}

class BlpapiSubscription {
    _id;
    _dataToken;
    _statusToken;
    _correlationId;
    _lastStatus = undefined;
    _isStarted = false;
    _isFinished = false;
    _demux;
    _unsubscriptionRequestSent = false;
    _subscriptionStartedPromise;
    cookie = null;
    subscriptionString = "";
    constructor(demux, callback, meta) {
        if (!new.target) {
            throw new Error("constructor called without new");
        }
        this._demux = demux;
        this._correlationId = demux.allocateCorrelationId();
        this._id = Symbol(`BlpapiSubscription:${this._correlationId}`);
        this._dataToken = demux.addHandler(this.augment(callback));
        this._statusToken = demux.addHandler(this.augment(this.processStatusMessage.bind(this)));
        this._subscriptionStartedPromise = createFulfillablePromise();
        for (const name of Object.keys(meta)) {
            this[name] = meta[name];
        }
        this._demux.addPatterns(this._dataToken, [[null, null, this._correlationId]]);
        this._demux.addPatterns(this._statusToken, [
            ["SUBSCRIPTION_STATUS", null, this._correlationId]
        ]);
        this._demux.waitRemoved(this._statusToken).then(() => {
            this._demux.removeHandler(this._dataToken);
        });
        this._demux.waitRemoved(this._dataToken).then(() => {
        });
    }
    get demux() {
        return this._demux;
    }
    get dataToken() {
        return this._dataToken;
    }
    get correlationId() {
        return this._correlationId;
    }
    get lastStatus() {
        return this._lastStatus;
    }
    set lastStatus(value) {
        if (value && !(value instanceof BlpapiData)) {
            throw new Error("this property can only be BlpapiData objects null");
        }
        this._lastStatus = value;
    }
    augment(callback) {
        return (eventType, msg) => {
            this.augmentMessage(msg);
            return callback(eventType, msg);
        };
    }
    augmentMessage(msg) {
        if (typeof msg === "undefined") {
            return;
        }
        msg[BlpapiData.CALLBACK_MSG_PROPS["subscription"]] = this;
        for (const name of Object.keys(this)) {
            msg[BlpapiData.CALLBACK_MSG_PROPS[name]] = this[name];
        }
    }
    processStatusMessage(eventType, msg) {
        if (eventType !== "SUBSCRIPTION_STATUS") {
            return true;
        }
        this.augmentMessage(msg);
        let shallContinue = true;
        const statusData = BlpapiData.fromBlpapiMessage(eventType, msg);
        switch (msg.messageType) {
            case "SubscriptionStarted":
                this._subscriptionStartedPromise.resolve(statusData);
                this._isStarted = true;
                break;
            case "SubscriptionStreamsActivated":
                break;
            case "SubscriptionStreamsDeactivated":
                break;
            case "SubscriptionFailure":
                this._isStarted = false;
                this._isFinished = true;
                this._subscriptionStartedPromise.reject(statusData);
                this._demux.deallocateCorrelationId(this._correlationId);
                shallContinue = false;
                break;
            case "SubscriptionTerminated":
                this._isStarted = false;
                this._isFinished = true;
                if (this.isPending()) {
                    this._subscriptionStartedPromise.reject(statusData);
                }
                this._demux.deallocateCorrelationId(this._correlationId);
                shallContinue = false;
                break;
            default:
                console.warn("SubscriptionStatusMonitor handler received a message of unknown type.", msg);
                break;
        }
        this.lastStatus = statusData;
        return shallContinue;
    }
    isBlank() {
        return typeof this.lastStatus === "undefined";
    }
    isPending() {
        return this.lastStatus === null;
    }
    isStarted() {
        return this._isStarted;
    }
    isActive() {
        return (this.isStarted() && !this._unsubscriptionRequestSent);
    }
    isUnsubscribing() {
        return this._unsubscriptionRequestSent;
    }
    isFinished() {
        return this._isFinished;
    }
    markPending() {
        if (!this.isBlank())
            throw new Error("can only mark pending from blank state");
        this.lastStatus = null;
    }
    markUnsubscribing() {
        if (!this.isActive())
            throw new Error("can only mark unsubscribing from active state");
        this._unsubscriptionRequestSent = true;
    }
    waitStarted() {
        return this._subscriptionStartedPromise;
    }
}

class RealtimeDataSource {
    _blpapiSession;
    _dataChannel = null;
    _statusChangeHandlers = new Set();
    _subscriptions = new Map();
    constructor(session) {
        if (!session) {
            throw new Error("session is a mandatory parameter");
        }
        this._blpapiSession = session;
    }
    async destroy() {
        await this.unsubscribe(Array.from(this._subscriptions.values()).map(sub => sub._id));
        this._statusChangeHandlers.clear();
        this.setDataReceiver(null);
    }
    _setChannelForReceiver(channelPropertyName, receiver) {
        const oldChannel = this[channelPropertyName];
        if (oldChannel) {
            oldChannel.close();
        }
        let channel;
        if (receiver) {
            channel = new BlpapiDataChannel(receiver);
            channel.open(this);
        }
        else {
            channel = null;
        }
        this[channelPropertyName] = channel;
    }
    setDataReceiver(receiver) {
        this._setChannelForReceiver("_dataChannel", receiver);
    }
    async subscribe(subscriptionList) {
        if (!this._dataChannel) {
            throw new Error("can not add any subscriptions before the data receiver is set");
        }
        const logger = getLogger("RealtimeDataSource.prototype.subscribe");
        logger("Subscribing to", subscriptionList);
        const subscriptions = await this._blpapiSession.subscribe(subscriptionList, this._subscriptionCallback.bind(this));
        for (const subscription of subscriptions) {
            this._subscriptions.set(subscription._id, subscription);
            subscription.waitStarted().then((statusData) => { }, (statusData) => {
                const subscription = statusData.meta("subscription");
                if (subscription) {
                    this._subscriptions.delete(subscription._id);
                }
            });
        }
        return subscriptions.map(sub => sub._id);
    }
    async resubscribe(id, subscriptionString) {
        const subscription = this._subscriptions.get(id);
        if (!(subscription) || !(subscription instanceof BlpapiSubscription)) {
            throw new Error("invalid subscription");
        }
        await this._blpapiSession.resubscribe(subscription, subscriptionString);
    }
    async unsubscribe(ids) {
        if (isSymbol(ids)) {
            ids = [ids];
        }
        for (const id of ids) {
            const subscription = this._subscriptions.get(id);
            if (!(subscription) || !(subscription instanceof BlpapiSubscription)) {
                throw new Error("one or more invalid subscription(s)");
            }
            await this._blpapiSession.unsubscribe(subscription);
            this._subscriptions.delete(id);
        }
    }
    waitStarted(id) {
        const subscription = this._subscriptions.get(id);
        if (!(subscription) || !(subscription instanceof BlpapiSubscription)) {
            throw new Error("invalid subscription");
        }
        return subscription.waitStarted();
    }
    onStatusChanged(callback) {
        this._statusChangeHandlers.add(callback);
    }
    *activeSubscriptions() {
        for (const subscription of this._subscriptions.values()) {
            if (!subscription.isActive())
                continue;
            yield subscription._id;
        }
    }
    *pendingSubscriptions() {
        for (const subscription of this._subscriptions.values()) {
            if (!subscription.isPending())
                continue;
            yield subscription._id;
        }
    }
    getSubscriptionString(id) {
        const subscription = this._subscriptions.get(id);
        if (!(subscription) || !(subscription instanceof BlpapiSubscription)) {
            throw new Error("invalid subscription");
        }
        return subscription.subscriptionString;
    }
    getSubscriptionCookie(id) {
        const subscription = this._subscriptions.get(id);
        if (!(subscription) || !(subscription instanceof BlpapiSubscription)) {
            throw new Error("invalid subscription");
        }
        return subscription.cookie;
    }
    _subscriptionCallback(eventType, msg) {
        const logger = getLogger("RealtimeDataSource.prototype._subscriptionCallback");
        if (eventType === "SUBSCRIPTION_STATUS") {
            for (const callback of this._statusChangeHandlers) {
                try {
                    callback(BlpapiData.fromBlpapiMessage(eventType, msg));
                }
                catch (e) {
                    console.error("An exception was caught from status change handler", callback, " - ", e);
                }
            }
            return true;
        }
        else if (eventType !== "SUBSCRIPTION_DATA") {
            console.warn("Received a subscription message with unrecognized eventType", eventType, msg);
            return true;
        }
        let processed = false;
        let dataChannel = this._dataChannel;
        dataChannel = dataChannel && dataChannel.isOpen() ? dataChannel : null;
        if (dataChannel) {
            processed = dataChannel.processBlpapiMessage(eventType, msg);
        }
        if (!processed) {
            const subscriptions = Array.from(this._subscriptions.values());
            logger("The data channel is now closed");
            if (subscriptions.length) {
                logger("Unsubscribing from", subscriptions.length, "subscriptions.");
                for (const subscription of subscriptions) {
                    this.unsubscribe(subscription._id).catch(e => {
                        console.error("Failed to send an unsubscription request for subscription", subscription, "because of an exception", e);
                    });
                }
            }
        }
        return dataChannel;
    }
}

class DataSession {
    _blpapiSession;
    constructor(blpapiSession) {
        if (!blpapiSession) {
            throw new Error("Invalid Argument");
        }
        this._blpapiSession = blpapiSession;
    }
    async destroy() {
        await this._blpapiSession.stop();
        return await this._blpapiSession.destroy();
    }
    addMessageReceiver(messagePatterns, receiver, cookie) {
        const ch = new BlpapiDataChannel(receiver);
        ch.open(cookie);
        const token = this._blpapiSession._demux.addHandler(ch.processBlpapiMessage.bind(ch));
        this._blpapiSession._demux.addPatterns(token, messagePatterns);
        this._blpapiSession._demux.waitRemoved(token).then(() => {
            ch.close();
        });
    }
    ;
    createControlDataSource(receiver) {
        if (!receiver || typeof receiver !== "function") {
            throw new Error("receiver is a mandatory parameter and should be a generator function");
        }
        return new ControlDataSource(this._blpapiSession, receiver);
    }
    ;
    createRealtimeDataSource(receiver) {
        const rds = new RealtimeDataSource(this._blpapiSession);
        rds.setDataReceiver(receiver || null);
        return rds;
    }
    ;
    async request(serviceName, operationName, request, receiver, cookie) {
        await this._blpapiSession.openService(serviceName);
        const service = await this._blpapiSession.getService(serviceName);
        const blpapiRequest = await service.createRequest(operationName, request);
        const channel = new BlpapiDataChannel(receiver);
        channel.open(cookie);
        const allResponsesReceived = await this._blpapiSession.sendRequest(blpapiRequest, channel.processBlpapiMessage.bind(channel));
        await allResponsesReceived;
        channel.close();
    }
    async getReferenceData(securities, fields, overrides) {
        const result = [];
        let blpRequest = {
            "securities": [].concat(securities),
            "fields": [].concat(fields)
        };
        if (overrides) {
            blpRequest["overrides"] = [].concat(overrides);
        }
        await this.request(BlpapiServiceType.RefData, BlpapiRequestType.ReferenceData, blpRequest, function* () { let data; while (data = yield) {
            result.push(data);
        } });
        return result;
    }
    async getHistoricalData(securities, fields, startDate, endDate, periodicity, overrides) {
        let error = null;
        const result = [];
        let blpRequest = {
            "securities": [].concat(securities),
            "fields": [].concat(fields),
            "startDate": startDate instanceof BlpapiDatetime ? startDate.toDateString() : startDate,
            "endDate": endDate instanceof BlpapiDatetime ? endDate.toDateString() : endDate,
            "periodicitySelection": periodicity
        };
        if (overrides) {
            blpRequest["overrides"] = [].concat(overrides);
        }
        await this.request(BlpapiServiceType.RefData, BlpapiRequestType.HistoricalData, blpRequest, function* () {
            let data;
            while (data = yield) {
                if (data.responseError)
                    return (error = new BlpapiResponseError(data.responseError));
                result.push(data);
            }
        });
        if (error)
            throw (error);
        return result;
    }
    async getPortfolioList(appId) {
        const result = [];
        const blpRequest = {
            "listType": "catalog",
            "listId": "PORTFOLIO",
            "applicationId": appId
        };
        await this.request(BlpapiServiceType.PortfolioList, BlpapiRequestType.PortfolioList, blpRequest, function* () { let data; while (data = yield) {
            result.push(data);
        } });
        return result;
    }
    async getPortfolioData(securities, fields, overrides) {
        const result = [];
        let blpRequest = {
            "securities": [].concat(securities),
            "fields": [].concat(fields)
        };
        if (overrides) {
            blpRequest["overrides"] = [].concat(overrides);
        }
        await this.request(BlpapiServiceType.RefData, BlpapiRequestType.PortfolioData, blpRequest, function* () { let data; while (data = yield) {
            result.push(data);
        } });
        return result;
    }
    async getFieldInfo(fields, returnFieldDocumentation) {
        let error = null;
        const result = [];
        await this.request(BlpapiServiceType.ApiFields, BlpapiRequestType.FieldInfo, {
            id: [].concat(fields),
            returnFieldDocumentation: !!returnFieldDocumentation
        }, function* () {
            let data;
            while (data = yield) {
                if (data.responseError)
                    return (error = new BlpapiResponseError(data.responseError));
                result.push(data);
            }
        });
        if (error)
            throw (error);
        return result;
    }
    async getIntradayTick(security, eventTypes, startDateTime, endDateTime, includeConditionCodes) {
        let error = null;
        const result = [];
        await this.request(BlpapiServiceType.RefData, BlpapiRequestType.IntradayTick, {
            security: security,
            eventTypes: [].concat(eventTypes),
            startDateTime: startDateTime instanceof BlpapiDatetime ? startDateTime.toDateTimeString() : startDateTime,
            endDateTime: endDateTime instanceof BlpapiDatetime ? endDateTime.toDateTimeString() : endDateTime,
            includeConditionCodes: !!includeConditionCodes
        }, function* () {
            let data;
            while (data = yield) {
                if (data.responseError)
                    return (error = new BlpapiResponseError(data.responseError));
                result.push(data);
            }
        });
        if (error)
            throw (error);
        return result;
    }
    async getIntradayBar(security, eventType, startDateTime, endDateTime, interval) {
        let error = null;
        const result = [];
        await this.request(BlpapiServiceType.RefData, BlpapiRequestType.IntradayBar, {
            security: security,
            eventType: eventType,
            startDateTime: startDateTime instanceof BlpapiDatetime ? startDateTime.toDateTimeString() : startDateTime,
            endDateTime: endDateTime instanceof BlpapiDatetime ? endDateTime.toDateTimeString() : endDateTime,
            interval: interval
        }, function* () {
            let data;
            while (data = yield) {
                if (data.responseError)
                    return (error = new BlpapiResponseError(data.responseError));
                result.push(data);
            }
        });
        if (error)
            throw (error);
        return result;
    }
}

class BlpapiRequest {
    _requestId;
    constructor(requestId) {
        this._requestId = requestId;
    }
}

class BlpapiService {
    _serviceId;
    constructor(serviceId) {
        this._serviceId = serviceId;
    }
    async createRequest(operationName, requestData) {
        const logger = getLogger("BlpapiService.createRequest(", arguments, ")");
        logger("called");
        const requestId = await callbackPromise(window.bb.apps.blpapi.service.createRequest, this._serviceId, operationName, requestData);
        const result = new BlpapiRequest(requestId);
        logger("returned", result);
        return result;
    }
}

class BlpapiMessageDemultiplexer {
    _openCorrelationIds = new Set();
    _handlers = new Map();
    _lastUsedCorrelationId = 0;
    constructor() {
        if (!new.target) {
            throw new Error("this constructor function should be called with 'new'");
        }
    }
    isValidCorrelationId(correlationId) {
        return this._openCorrelationIds.has(correlationId);
    }
    allocateCorrelationId() {
        let correlationId = this._lastUsedCorrelationId + 1;
        while (this.isValidCorrelationId(correlationId)) {
            correlationId += 1;
        }
        this._openCorrelationIds.add(correlationId);
        this._lastUsedCorrelationId = correlationId;
        return correlationId;
    }
    deallocateCorrelationId(correlationId) {
        return this._openCorrelationIds.delete(correlationId);
    }
    addHandler(callback) {
        const token = Symbol("MessageHandler");
        this._handlers.set(token, {
            patterns: new Set(),
            callback: callback,
            removedPromise: {
                promise: null,
                resolve: null,
                reject: null
            },
        });
        return token;
    }
    addPatterns(token, messagePatterns) {
        for (const messagePatternCode of walkMessagePatternCodes(messagePatterns)) {
            this.addPatternCode(token, messagePatternCode);
        }
    }
    removePatterns(token, messagePatterns) {
        for (const messagePatternCode of walkMessagePatternCodes(messagePatterns)) {
            this.removePatternCode(token, messagePatternCode);
        }
    }
    addPatternCode(token, messagePatternCode) {
        const handler = this._handlers.get(token);
        if (!handler) {
            throw new Error("invalid token");
        }
        const tokenSet = this._handlers.get(messagePatternCode) || new Set();
        this._handlers.set(messagePatternCode, tokenSet);
        tokenSet.add(token);
        handler.patterns.add(messagePatternCode);
    }
    removePatternCode(token, messagePatternCode) {
        const tokenSet = this._handlers.get(messagePatternCode);
        if (tokenSet) {
            tokenSet.delete(token);
        }
        const handler = this._handlers.get(token);
        if (handler) {
            handler.patterns.delete(messagePatternCode);
        }
    }
    removeHandler(token) {
        const handler = this._handlers.get(token);
        this._handlers.delete(token);
        if (!handler) {
            return false;
        }
        for (const messagePatternCode of handler.patterns) {
            this.removePatternCode(token, messagePatternCode);
        }
        if (handler.removedPromise.resolve) {
            handler.removedPromise.resolve();
        }
        return true;
    }
    processBlpapiEvent(e) {
        for (const msg of e.messages) {
            for (const [token, callback] of this.walkMessageHandlers(e.eventType, msg.messageType, msg.correlationId)) {
                let shallContinue = false;
                try {
                    shallContinue = callback(e.eventType, msg);
                }
                catch (err) {
                    console.error("BlpapiMessageDemultiplexer: Ignoring an exception", err, "from message handler", callback, "(which will be terminated)", "while processing", e.eventType, msg);
                }
                if (!shallContinue) {
                    this.removeHandler(token);
                }
            }
        }
    }
    *walkMessageHandlers(eventType, messageType, correlationId) {
        for (const e of [eventType, null]) {
            for (const m of [messageType, null]) {
                for (const c of [correlationId, null]) {
                    const messagePatternCode = generateMessagePatternCode(e, m, c);
                    if (!this._handlers.has(messagePatternCode))
                        continue;
                    const tokenSet = this._handlers.get(messagePatternCode);
                    for (const token of tokenSet) {
                        if (!this._handlers.has(token)) {
                            tokenSet.delete(token);
                            console.error("Removed a dangling token", token, "from message pattern code", messagePatternCode);
                            continue;
                        }
                        const handler = this._handlers.get(token);
                        yield [token, handler.callback];
                    }
                }
            }
        }
    }
    waitRemoved(token) {
        const handler = this._handlers.get(token);
        if (!handler) {
            return Promise.resolve();
        }
        if (!handler.removedPromise.promise) {
            handler.removedPromise.promise = new Promise((resolve, reject) => {
                handler.removedPromise.resolve = resolve;
                handler.removedPromise.reject = reject;
            });
        }
        return handler.removedPromise.promise;
    }
}
function* walkMessagePatternCodes(messagePatterns) {
    if (messagePatterns === null) {
        return yield generateMessagePatternCode(null, null, null);
    }
    else if (!Array.isArray(messagePatterns)) {
        throw new Error("messagePatterns parameter can be either an array or null");
    }
    for (const pattern of messagePatterns) {
        let eventType = null;
        let messageType = null;
        let correlationId = null;
        if (typeof pattern === "string") {
            eventType = pattern;
        }
        else if (Array.isArray(pattern)) {
            [eventType, messageType, correlationId] = pattern.concat([null, null, null]);
        }
        else {
            throw new Error(`Unrecognized message pattern - (${pattern}) ${JSON.stringify(pattern)}`);
        }
        yield generateMessagePatternCode(eventType, messageType, correlationId);
    }
}
function generateMessagePatternCode(eventType, messageType, correlationId) {
    return JSON.stringify([eventType, messageType, correlationId]);
}

async function createBlpapiSession(options) {
    const logger = getLogger("createBlpapiSession(", arguments, ")");
    logger("called");
    const result = await (new BlpapiSession(options))._constructed;
    logger("returned", result);
    return result;
}
class BlpapiSession {
    _sessionId = null;
    _constructed = null;
    _demux = new BlpapiMessageDemultiplexer();
    constructor(options) {
        const sessionIdPromise = callbackPromise(window.bb.apps.blpapi.createSession, options || {}, this._demux.processBlpapiEvent.bind(this._demux));
        this._constructed = sessionIdPromise.then((sessionId) => {
            const sessionId_ = JSON.parse(JSON.stringify(sessionId));
            if (window.bb && window.bb.webview && typeof window.bb.webview.setGcTag === "function") {
                window.bb.webview.setGcTag(sessionId_, "_gctag", JSON.stringify({
                    type: "session",
                    id: sessionId
                }));
            }
            else {
                console.warn("The bb.webview.setGcTag function is not present, " +
                    "session objects might now be collected on time.");
            }
            this._sessionId = sessionId_;
            return Promise.resolve(this);
        });
    }
    async start() {
        const logger = getLogger("BlpapiSession.start(", arguments, ")");
        logger("called");
        await callbackPromise(window.bb.apps.blpapi.session.start, this._sessionId);
        logger("returned");
    }
    async stop() {
        const logger = getLogger("BlpapiSession.stop(", arguments, ")");
        logger("called");
        await callbackPromise(window.bb.apps.blpapi.session.stop, this._sessionId);
        logger("returned");
    }
    async destroy() {
        const logger = getLogger("BlpapiSession.destroy(", arguments, ")");
        logger("called");
        await callbackPromise(window.bb.apps.blpapi.session.destroy, this._sessionId);
        logger("returned");
    }
    async openService(serviceName) {
        const logger = getLogger("BlpapiSession.openService(", arguments, ")");
        logger("called");
        await callbackPromise(window.bb.apps.blpapi.session.openService, this._sessionId, serviceName);
        logger("returned");
    }
    async getService(serviceName) {
        const logger = getLogger("BlpapiSession.getService(", arguments, ")");
        logger("called");
        const serviceId = await callbackPromise(window.bb.apps.blpapi.session.getService, this._sessionId, serviceName);
        const result = new BlpapiService(serviceId);
        logger("returned ", result);
        return result;
    }
    async sendRequest(request, callback) {
        if (typeof request === "undefined")
            throw new Error("request is a mandatory parameter");
        if (typeof callback === "undefined")
            throw new Error("callback is a mandatory parameter");
        const logger = getLogger("BlpapiSession.sendRequest(", arguments, ")");
        logger("called");
        const correlationId = this._demux.allocateCorrelationId();
        const allResponsesReceived = new Promise((resolve, reject) => {
            try {
                const eventTypes = ["PARTIAL_RESPONSE", "RESPONSE"];
                let theException = undefined;
                const token = this._demux.addHandler((eventType, msg) => {
                    try {
                        return callback(eventType, msg) && eventType !== "RESPONSE";
                    }
                    catch (e) {
                        theException = e;
                        console.error("Caught an exception", e, "while processing a response message:", eventType, msg);
                        return false;
                    }
                });
                this._demux.waitRemoved(token).then(() => {
                    this._demux.deallocateCorrelationId(correlationId);
                    if (theException) {
                        reject(theException);
                    }
                    else {
                        resolve();
                    }
                });
                this._demux.addPatterns(token, eventTypes.map(x => [x, null, correlationId]));
            }
            catch (e) {
                reject(e);
            }
        });
        await callbackPromise(window.bb.apps.blpapi.session.sendRequest, this._sessionId, request._requestId, correlationId);
        logger("returned", allResponsesReceived);
        return allResponsesReceived;
    }
    async subscribe(subscriptionList, callback) {
        const logger = getLogger("BlpapiSession.subscribe()");
        logger("called");
        if (typeof subscriptionList === "undefined")
            throw new Error("subscriptionList is a mandatory parameter");
        if (typeof callback === "undefined")
            throw new Error("callback is a mandatory parameter");
        const lowerLevelSubscriptionList = [];
        const resultingSubscriptions = [];
        for (let [subscriptionString, cookie] of walkSubscriptionList(subscriptionList)) {
            const subscription = new BlpapiSubscription(this._demux, callback, {
                cookie: cookie,
                subscriptionString: subscriptionString,
            });
            subscription.demux.waitRemoved(subscription.dataToken).then(() => {
                this.unsubscribe(subscription).catch(e => {
                    console.error("Problem sending unsubscribe request for subscription", subscription, "because of an exception", e);
                });
            });
            lowerLevelSubscriptionList.push([
                subscription.correlationId,
                subscription.subscriptionString
            ]);
            resultingSubscriptions.push(subscription);
        }
        await callbackPromise(window.bb.apps.blpapi.session.subscribe, this._sessionId, lowerLevelSubscriptionList);
        for (const subscription of resultingSubscriptions) {
            subscription.markPending();
        }
        return resultingSubscriptions;
    }
    async resubscribe(subscription, subscriptionString) {
        if (!(subscription instanceof BlpapiSubscription))
            throw new Error("invalid subscription");
        if (!this._demux.isValidCorrelationId(subscription.correlationId))
            throw new Error(`CorrelationId:${subscription.correlationId} is not valid`);
        await callbackPromise(window.bb.apps.blpapi.session.resubscribe, this._sessionId, [[subscription.correlationId, subscriptionString]]);
        subscription.subscriptionString = subscriptionString;
    }
    async unsubscribe(subscription) {
        const logger = getLogger("BlpapiSession.prototype.unsubscribe");
        if (!(subscription instanceof BlpapiSubscription))
            throw new Error("invalid subscription");
        if (subscription.isUnsubscribing() || subscription.isFinished())
            return false;
        if (!this._demux.isValidCorrelationId(subscription.correlationId))
            throw new Error(`CorrelationId:${subscription.correlationId} is not valid`);
        subscription.markUnsubscribing();
        await callbackPromise(window.bb.apps.blpapi.session.unsubscribe, this._sessionId, [[subscription.correlationId, "_?"]]);
        logger("Unsubscription request sent successfully");
        return true;
    }
}
function* walkSubscriptionList(subscriptionList, defaultCookie) {
    if (typeof subscriptionList === "string") {
        return yield [subscriptionList, defaultCookie];
    }
    for (const entry of subscriptionList) {
        const [subscriptionString, cookie] = (typeof entry === "string" ? [entry, undefined] : entry);
        yield [subscriptionString, cookie !== undefined ? cookie : defaultCookie];
    }
}

class BBFormulaGenerator {
    BDP(ticker, field, overrides) {
        return "=BDP(\"" + ticker + "\",\"" + field + "\"" + (overrides !== undefined ? ",\"" + overrides + "\"" : "") + ")";
    }
    BDH(ticker, field, startDate, endDate, overrides) {
        return "=BDH(\"" + ticker + "\",\"" + field + "\",\"" + startDate + "\",\"" + endDate + "\"" + (overrides !== undefined ? ",\"" + overrides + "\"" : "") + ")";
    }
}

class Spreadsheet {
    _cells = {};
    static regex = /\b([A-Z]+)(\d+)$\b/;
    constructor(cells) {
        if (cells !== undefined)
            if (!this.addCells(cells))
                throw new Error("One or more cell IDs don't have the correct pattern <letters><numbers>.");
    }
    getCell(id) {
        let cell = this._cells[id.toUpperCase()];
        return cell ? { ...this._cells[id.toUpperCase()] } : null;
    }
    getCells() {
        let cells = {};
        for (let currCell in this._cells) {
            cells[currCell] = { ...this._cells[currCell] };
        }
        return cells;
    }
    addCells(cells) {
        if (Object.keys(cells).some(id => !Spreadsheet.regex.test(id.toUpperCase())))
            return false;
        for (let id in cells) {
            this._cells[id.toUpperCase()] = { ...cells[id] };
        }
        return true;
    }
    removeCells(ids) {
        ids.forEach(id => delete this._cells[id.toUpperCase()]);
    }
    _convertToDocBuilder(name) {
        let minCol = -1;
        let minRow = -1;
        let sortedCells = [];
        for (let id in this._cells) {
            let regGroups = id.match(Spreadsheet.regex);
            if (!regGroups)
                throw new Error("Wrong cell ID.");
            let col = this._lettersToDigits(regGroups[1]);
            let row = parseInt(regGroups[2]);
            if (minCol == -1 || col < minCol)
                minCol = col;
            if (minRow == -1 || row < minRow)
                minRow = row;
            sortedCells.push({ "id": { "col": col, "row": row }, "cell": this._cells[id] });
        }
        sortedCells.sort((a, b) => {
            let res = a.id.row - b.id.row;
            if (res != 0)
                return res;
            return a.id.col - b.id.col;
        });
        let spreadsheetDoc = "<DocumentPart name=\"" + name + "\"><Section columnLocation=\"" + minCol.toString() + "\" rowLocation=\"" + minRow.toString() + "\">";
        if (sortedCells.length == 0) {
            spreadsheetDoc += "<Row/>";
        }
        else {
            let prevCol = minCol - 1;
            let prevRow = minRow - 1;
            let isFirst = true;
            for (let currCell in sortedCells) {
                let diff = sortedCells[currCell].id.row - prevRow;
                if (diff > 0) {
                    if (isFirst)
                        isFirst = false;
                    else
                        spreadsheetDoc += "</Row>";
                    for (let i = 1; i < diff; i++) {
                        spreadsheetDoc += "<Row/>";
                    }
                    prevRow = sortedCells[currCell].id.row;
                    prevCol = minCol - 1;
                    spreadsheetDoc += "<Row>";
                }
                diff = sortedCells[currCell].id.col - prevCol;
                for (let i = 1; i < diff; i++) {
                    spreadsheetDoc += "<Cell/>";
                }
                prevCol = sortedCells[currCell].id.col;
                spreadsheetDoc += this._convertCell(sortedCells[currCell].cell);
            }
            spreadsheetDoc += "</Row></Section></DocumentPart>";
        }
        return spreadsheetDoc;
    }
    _convertCell(cell) {
        let cellRes = "<Cell ";
        let valName = "value";
        let type = cell.Type || "string";
        if (cell.Type == CellType.FormulaType)
            valName = CellType.FormulaType;
        else
            cellRes += "valuetype=\"" + type + "\" ";
        let val = cell.Value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
        cellRes += valName + "=\"" + val + "\" ";
        if (cell.Style)
            cellRes += "style=\"" + cell.Style + "\" ";
        cellRes += "/>";
        return cellRes;
    }
    _lettersToDigits(letters) {
        let res = 0;
        for (let i = 0; i < letters.length; i++) {
            res = (res * 26) + (letters[i].charCodeAt(0) - 'A'.charCodeAt(0) + 1);
        }
        return res;
    }
}

class Workbook {
    _spreadsheets = {};
    getSpreadsheet(id) {
        let spreadsheet = this._spreadsheets[id];
        return spreadsheet ? new Spreadsheet(spreadsheet.getCells()) : null;
    }
    addSpreadsheet(id, spreadsheet) {
        if (this._spreadsheets[id] !== undefined)
            return false;
        this._spreadsheets[id] = spreadsheet;
        return true;
    }
    removeSpreadsheet(id) {
        if (this._spreadsheets[id] === undefined)
            return false;
        delete this._spreadsheets[id];
        return true;
    }
    exportToExcel(filename, responseHandler) {
        return new Promise(async (resolve, reject) => {
            try {
                if (Object.keys(this._spreadsheets).length == 0)
                    throw new Error("Must have at least one spreadsheet in order to export.");
                if (!filename || !filename.endsWith(".xlsx") || (filename.includes("\\")))
                    throw new Error("Wrong filename.");
                let workbookDoc = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                    "<Document xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" " +
                    "xmlns=\"http://www.bloomberg.com/DesktopServices/EDIT\">";
                for (let currSpreadsheet in this._spreadsheets) {
                    workbookDoc += ((this._spreadsheets[currSpreadsheet])._convertToDocBuilder(currSpreadsheet));
                }
                workbookDoc += "</Document>";
                window.bb.apps.blpapi.dataExport(workbookDoc, filename, (isSuccessful, result) => {
                    responseHandler(isSuccessful, { Path: isSuccessful ? result : "", ErrorMsg: isSuccessful ? "" : result });
                }, () => {
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
}

class DataExport {
    _generator;
    constructor() {
        this._generator = new BBFormulaGenerator();
    }
    createWorkbook() {
        return new Workbook();
    }
    createSpreadsheet(cells) {
        return new Spreadsheet(cells);
    }
    get BBFormulaGenerator() {
        return this._generator;
    }
}

class GlobalData {
    _export;
    constructor() {
        this._export = new DataExport();
    }
    get Export() {
        return this._export;
    }
    async createSession(options) {
        const blpapiSession = await createBlpapiSession(options);
        const session = new DataSession(blpapiSession);
        await blpapiSession.start();
        return session;
    }
}
var index = (function () {
    window.BB = window.BB || {};
    window.BB.Apps = window.BB.Apps || {};
    window.BB.Apps.Data = window.BB.Apps.Data || new GlobalData();
    return window.BB.Apps.Data;
})();

export { BlpapiDatetime, BlpapiRequestType, BlpapiResponseError, BlpapiServiceType, CellType, EventType, GlobalData, Periodicity, index as default };
