var ScreenPos;
(function (ScreenPos) {
    ScreenPos[ScreenPos["CENTER_OWNER"] = -1] = "CENTER_OWNER";
    ScreenPos[ScreenPos["CENTER_SCREEN"] = -2] = "CENTER_SCREEN";
})(ScreenPos || (ScreenPos = {}));
class ScreenPosValues {
    CENTER_OWNER = ScreenPos.CENTER_OWNER;
    CENTER_SCREEN = ScreenPos.CENTER_SCREEN;
}
var WindowPos;
(function (WindowPos) {
    WindowPos[WindowPos["TOP_LEFT"] = 0] = "TOP_LEFT";
    WindowPos[WindowPos["MIDDLE_LEFT"] = 1] = "MIDDLE_LEFT";
    WindowPos[WindowPos["BOTTOM_LEFT"] = 2] = "BOTTOM_LEFT";
    WindowPos[WindowPos["BOTTOM_MIDDLE"] = 3] = "BOTTOM_MIDDLE";
    WindowPos[WindowPos["BOTTOM_RIGHT"] = 4] = "BOTTOM_RIGHT";
    WindowPos[WindowPos["MIDDLE_RIGHT"] = 5] = "MIDDLE_RIGHT";
    WindowPos[WindowPos["TOP_RIGHT"] = 6] = "TOP_RIGHT";
    WindowPos[WindowPos["TOP_MIDDLE"] = 7] = "TOP_MIDDLE";
    WindowPos[WindowPos["CENTER"] = 8] = "CENTER";
})(WindowPos || (WindowPos = {}));
class WindowPosValues {
    TOP_LEFT = WindowPos.TOP_LEFT;
    MIDDLE_LEFT = WindowPos.MIDDLE_LEFT;
    BOTTOM_LEFT = WindowPos.BOTTOM_LEFT;
    BOTTOM_MIDDLE = WindowPos.BOTTOM_MIDDLE;
    BOTTOM_RIGHT = WindowPos.BOTTOM_RIGHT;
    MIDDLE_RIGHT = WindowPos.MIDDLE_RIGHT;
    TOP_RIGHT = WindowPos.TOP_RIGHT;
    TOP_MIDDLE = WindowPos.TOP_MIDDLE;
    CENTER = WindowPos.CENTER;
}
var WindowPosFlags;
(function (WindowPosFlags) {
    WindowPosFlags[WindowPosFlags["NONE"] = 0] = "NONE";
    WindowPosFlags[WindowPosFlags["MIN_OVERLAP"] = 1] = "MIN_OVERLAP";
})(WindowPosFlags || (WindowPosFlags = {}));
class WindowPosFlagsValues {
    NONE = WindowPosFlags.NONE;
    MIN_OVERLAP = WindowPosFlags.MIN_OVERLAP;
}

class BlpComponent {
    _id;
    _name;
    constructor(compId, compName) {
        this._id = parseInt(compId, 10) || 0;
        this._name = compName || null;
    }
    get compId() {
        return this._id;
    }
    get compName() {
        return this._name || null;
    }
    setProperty(name, value) {
        const props = { [name]: value };
        return this.setProperties(props);
    }
    setProperties(props) {
        return new Promise((resolve, reject) => {
            const list = [];
            if (props && props.constructor === Object) {
                for (const name of Object.getOwnPropertyNames(props)) {
                    list.push({ name, value: props[name] });
                }
            }
            window.bb.apps.app.launchComp("set", this._id, this._name, list, null, () => {
                resolve();
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
}

const _apiVersion$1 = (() => {
    if (window.bb && window.bb.apps && window.bb.apps.version)
        return JSON.parse(window.bb.apps.version());
    else
        return { major: 0, minor: 0, build: 0, revision: 0 };
})();
const _isMay2019Api$1 = _apiVersion$1.major > 2019 || (_apiVersion$1.major == 2019 && _apiVersion$1.minor >= 5);
class AppPortalComponent {
    _id = 0;
    _title = null;
    _location = null;
    _left = 0;
    _top = 0;
    _width = 0;
    _height = 0;
    _isDialog = false;
    _launchId = null;
    _compId = 0;
    _compUniqueId = null;
    _compToken = null;
    _propSubId = 0;
    _propertyChangeHandlers = {};
    _properties = {};
    constructor(info) {
        this._init(info);
    }
    get id() {
        return this._id;
    }
    get title() {
        this._update();
        return this._title || null;
    }
    get location() {
        this._update();
        return this._location || null;
    }
    get left() {
        this._update();
        return this._left || 0;
    }
    get top() {
        this._update();
        return this._top || 0;
    }
    get width() {
        this._update();
        return this._width || 0;
    }
    get height() {
        this._update();
        return this._height || 0;
    }
    get isDialog() {
        return !!this._isDialog;
    }
    getProperty(name) {
        if (!_isMay2019Api$1) {
            if (name === "app_data") {
                if (BB.Apps.Component === this) {
                    const value = this._properties["__data"];
                    return value === undefined ? null : value;
                }
            }
            else if (name === "Security 1" || name === "security1") {
                if (BB.Apps.Component === this) {
                    const value = this._properties["__security1"];
                    return value === undefined ? null : value;
                }
                else {
                    const winInfo = JSON.parse(window.bb.apps.app.getWindowInfo(this._id));
                    return winInfo.sec1;
                }
            }
            else if (name === "Security 2" || name === "security2") {
                if (BB.Apps.Component === this) {
                    const value = this._properties["__security2"];
                    return value === undefined ? null : value;
                }
                else {
                    const winInfo = JSON.parse(window.bb.apps.app.getWindowInfo(this._id));
                    return winInfo.sec2;
                }
            }
            else {
                const value = this._properties[name];
                return value === undefined ? null : value;
            }
        }
        let value = window.bb.apps.app.getProperty(this._id, name);
        try {
            value = JSON.parse(value);
        }
        catch {
        }
        return value;
    }
    setProperty(name, value) {
        return this.setProperties({ [name]: value });
    }
    setProperties(props) {
        try {
            for (const name of Object.getOwnPropertyNames(props)) {
                if (!_isMay2019Api$1) {
                    const propName = (name === 'security1' ? "Security 1" : (name === 'security2' ? "Security 2" : name));
                    if (propName === "Security 1" || propName === "Security 2") {
                        window.bb.apps.app.setSecurity(this._id, propName, props[name]);
                    }
                    else if (propName === "app_data") {
                        this._properties["__data"] = JSON.stringify(props[name]);
                        this._raisePropertyChanged("app_data", this._properties["__data"]);
                    }
                    else {
                        this._properties[name] = props[name];
                        this._raisePropertyChanged(name, props[name]);
                    }
                }
                else {
                    window.bb.apps.app.setProperty(this._id, name, props[name]);
                }
            }
            return Promise.resolve();
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    addPropertyChangeHandler(handler) {
        if (!handler || !handler.call)
            return 0;
        if (_isMay2019Api$1) {
            return window.bb.apps.app.addPropertyChangeHandler(this._id, (name, value) => {
                try {
                    value = JSON.parse(value);
                }
                catch {
                }
                handler(name, value);
            });
        }
        else {
            const subId = ++this._propSubId;
            this._propertyChangeHandlers[subId] = handler;
            return subId;
        }
    }
    removePropertyChangeHandler(subId) {
        if (_isMay2019Api$1) {
            return window.bb.apps.app.removePropertyChangeHandler(this._id, subId);
        }
        else {
            const existed = !!this._propertyChangeHandlers[subId];
            delete this._propertyChangeHandlers[subId];
            return existed;
        }
    }
    close(noHandler) {
        return window.bb.apps.app.close(window.BB.Apps.App.instanceId, this._id, !!noHandler);
    }
    closeWithResult(result) {
        return window.bb.apps.app.close(window.BB.Apps.App.instanceId, this._id, true, result);
    }
    cancelClose() {
        return window.bb.apps.app.cancelClose(this._id);
    }
    setCloseHandler(handler) {
        return window.bb.apps.app.setCloseHandler(this._id, handler);
    }
    setSize(width, height) {
        return window.bb.apps.app.setWindowSize(this._id, width, height);
    }
    setPosition(x, y) {
        return window.bb.apps.app.setWindowPos(this._id, x, y);
    }
    setTitle(title) {
        return window.bb.apps.app.setWindowTitle(this._id, title);
    }
    setLocation(target, base) {
        const url = new URL(target, base || this._location || window.location.href);
        return window.bb.apps.app.setWindowLocation(this._id, url.toString());
    }
    setRelPosition(otherIdOrToken, otherPoint, selfPoint) {
        return window.bb.apps.app.setWindowRelPos(this._id, otherIdOrToken, otherPoint, selfPoint);
    }
    _update() {
        this._init(JSON.parse(window.bb.apps.app.getWindowInfo(this._id)));
    }
    _init(info) {
        if (!info)
            return;
        this._id = (info.winId || info.id) || 0;
        this._title = info.title || null;
        this._location = info.loc || null;
        this._left = info.xPos || 0;
        this._top = info.yPos || 0;
        this._width = info.width || 0;
        this._height = info.height || 0;
        this._isDialog = info.isDialog || false;
        this._launchId = info.launchId || null;
        this._compId = parseInt(info.compId, 10) || 0;
        this._compUniqueId = info.compUniqueId || null;
        this._compToken = info.compToken || null;
        if (!_isMay2019Api$1) {
            if (this._id !== 0) {
                this._properties["__data"] = info.args;
            }
            this._properties["__security1"] = info.sec1;
            this._properties["__security2"] = info.sec2;
        }
    }
    _raisePropertyChanged(name, value) {
        for (const subId of Object.getOwnPropertyNames(this._propertyChangeHandlers)) {
            const callback = this._propertyChangeHandlers[subId];
            callback(name, value);
        }
    }
    _onPropertyChange(evData) {
        const data = JSON.parse(evData);
        if (data && data.security1) {
            this._properties["__security1"] = data.security1;
            this._raisePropertyChanged("Security 1", data.security1);
            this._raisePropertyChanged("security1", data.security1);
        }
        if (data && data.security2) {
            this._properties["__security2"] = data.security2;
            this._raisePropertyChanged("Security 2", data.security2);
            this._raisePropertyChanged("security2", data.security2);
        }
        if (data && !data.security1 && !data.security2) {
            this._properties["__data"] = evData;
            this._raisePropertyChanged("app_data", evData);
        }
    }
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
function createEventHandlers(events) {
    const state = {};
    events.forEach((ev) => {
        state[ev + "_set"] = false;
        state[ev + "_promise"] = new Promise((resolve, reject) => {
            state[ev + "_resolve"] = (data) => {
                window.clearTimeout(state[ev + "_timer"]);
                state[ev + "_set"] = true;
                resolve(data);
            };
            state[ev + "_reject"] = reject;
        });
    });
    state["set"] = (obj) => {
        events.forEach((ev) => {
            const propName = "is" + ev[0].toUpperCase() + ev.substring(1);
            Object.defineProperty(obj, propName, { "get": () => {
                    return state[ev + "_set"];
                } });
            obj[ev] = (timeout) => {
                if (timeout && timeout > 0) {
                    state[ev + "_timer"] = window.setTimeout(() => {
                        state[ev + "_reject"](new Error("Timeout waiting for " + ev + " event"));
                    }, timeout);
                }
                return state[ev + "_promise"];
            };
        });
    };
    return state;
}

const _apiVersion = (() => {
    if (window.bb && window.bb.apps && window.bb.apps.version)
        return JSON.parse(window.bb.apps.version());
    else
        return { major: 0, minor: 0, build: 0, revision: 0 };
})();
const _isMay2019Api = _apiVersion.major > 2019 || (_apiVersion.major == 2019 && _apiVersion.minor >= 5);
class GlobalApplication {
    _instanceId;
    ["ScreenPos"] = new ScreenPosValues();
    ["WindowPos"] = new WindowPosValues();
    ["WindowPosFlags"] = new WindowPosFlagsValues();
    constructor() {
        checkBBEnv();
        let info, component = new AppPortalComponent();
        if (_isMay2019Api) {
            info = JSON.parse(window.bb.apps.app.init(null, null));
        }
        else {
            const propChangeHandler = component._onPropertyChange.bind(component);
            info = JSON.parse(window.bb.apps.app.init(propChangeHandler, propChangeHandler));
        }
        this._instanceId = info.appId || info.id;
        if (!_isMay2019Api) {
            component._properties["__data"] = info.appData || info.data;
        }
        component._init(info.window);
        window.BB.Apps.Component = component;
    }
    get instanceId() {
        return this._instanceId;
    }
    get currentComponent() {
        return window.BB.Apps.Component || null;
    }
    createWindowComponent(url, config, args) {
        return new Promise((resolve, reject) => {
            checkBBEnv();
            if (!url) {
                throw new Error("Url is required");
            }
            config = (!!config) && (config.constructor === Object) ? config : {};
            config.dialog = !!config.dialog;
            const launchId = config["__BB_APPS_LAUNCH_ID__"] = uuid();
            const features = Object.getOwnPropertyNames(config).filter(name => name !== 'name' && name !== 'replace' && name !== 'timeout').map(name => name + "=" + config[name]).join(",");
            const evHandlers = createEventHandlers(['loaded', 'closed']);
            const resolveEventName = (_apiVersion.major > 2019 || (_apiVersion.major == 2019 && _apiVersion.minor >= 5)) ? "created" : "initialized";
            window.bb.apps.app.registerEventListener(launchId, evText => {
                const evObj = JSON.parse(evText);
                const evResolve = evHandlers[evObj.ev + "_resolve"];
                if (evResolve)
                    evResolve(evObj.data);
                if (evObj.ev === "error") {
                    window.clearTimeout(timerId);
                    window.bb.apps.app.unregisterEventListener(launchId);
                    const errMsg = evObj.data && evObj.data.message ? evObj.data.message : null;
                    reject(new Error(errMsg || "Failed to create window"));
                }
                else if (evObj.ev === resolveEventName) {
                    window.clearTimeout(timerId);
                    const component = new AppPortalComponent(evObj.data);
                    component.window = win;
                    evHandlers.set(component);
                    resolve(component);
                }
                else if (evObj.ev === "closed") {
                    window.bb.apps.app.unregisterEventListener(launchId);
                }
            });
            const timeout = config.timeout === undefined ? 10000 : config.timeout;
            const timerId = timeout > 0 ? window.setTimeout(() => {
                window.bb.apps.app.unregisterEventListener(launchId);
                reject(new Error("Timeout"));
            }, timeout) : 0;
            const win = window.open(url, config.name, features, config.replace, args);
        });
    }
    createAppPortalComponent(progId, config, args) {
        return new Promise((resolve, reject) => {
            checkBBEnv();
            if (!progId) {
                throw new Error("Valid progId is required");
            }
            const launchId = uuid();
            config = (!!config) && (config.constructor === Object) ? config : {};
            args = (!!args) && (args.constructor === Object) ? args : {};
            args["__BB_APPS_LAUNCH_ID__"] = launchId;
            args["__BB_APPS_PARENT_ID__"] = window.BB.Apps.App.instanceId;
            const evHandlers = createEventHandlers(['loaded', 'closed']);
            window.bb.apps.app.registerEventListener(launchId, evText => {
                const evObj = JSON.parse(evText);
                const evResolve = evHandlers[evObj.ev + "_resolve"];
                if (evResolve)
                    evResolve(evObj.data);
                if (evObj.ev === "error") {
                    window.clearTimeout(timerId);
                    window.bb.apps.app.unregisterEventListener(launchId);
                    const errMsg = evObj.data && evObj.data.message ? evObj.data.message : null;
                    reject(new Error(errMsg || "Failed to create component"));
                }
                else if (evObj.ev === "created") {
                    window.clearTimeout(timerId);
                    const component = new BlpComponent(evObj.data && evObj.data.compId ? evObj.data.compId : 0, evObj.data && evObj.data.compUniqueId ? "#" + evObj.data.compUniqueId : null);
                    evHandlers.set(component);
                    resolve(component);
                }
                else if (evObj.ev === "closed") {
                    window.bb.apps.app.unregisterEventListener(launchId);
                }
            });
            const timeout = config.timeout === undefined ? 10000 : config.timeout;
            const timerId = timeout > 0 ? window.setTimeout(() => {
                window.bb.apps.app.unregisterEventListener(launchId);
                reject(new Error("Timeout"));
            }, timeout) : 0;
            window.bb.apps.app.launchApp(progId, args, config, () => { }, (errCode, errMsg) => {
                window.clearTimeout(timerId);
                window.bb.apps.app.unregisterEventListener(launchId);
                reject(new Error(errMsg));
            });
        });
    }
    createBlpComponent(compId, compName, config, args) {
        return new Promise((resolve, reject) => {
            checkBBEnv();
            compId = parseInt(compId, 10);
            if (!compId || compId < 0) {
                throw new Error("Valid compId is required");
            }
            const props = [];
            if (args && args.constructor === Object) {
                for (const name of Object.getOwnPropertyNames(args)) {
                    props.push({ name, value: args[name] });
                }
            }
            compName = compName || uuid();
            window.bb.apps.app.launchComp("launch", compId, compName, props, config, () => {
                resolve(new BlpComponent(compId, compName));
            }, (errCode, errMsg) => {
                reject(new Error(errMsg));
            });
        });
    }
}

var index = (function () {
    window.BB = window.BB || {};
    window.BB.Apps = window.BB.Apps || {};
    window.BB.Apps.App = window.BB.Apps.App || new GlobalApplication();
    return window.BB.Apps.App;
})();

export { ScreenPos, ScreenPosValues, WindowPos, WindowPosFlags, WindowPosFlagsValues, WindowPosValues, index as default };
