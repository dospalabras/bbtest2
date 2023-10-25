let OAuthTokenResponse$1 = class OAuthTokenResponse {
    idToken = null;
    accessToken = null;
    state = null;
    constructor(idToken, accessToken, state) {
        this.idToken = idToken;
        this.accessToken = accessToken;
        this.state = state;
    }
};

class CryptoUtils {
    static newGUID() {
        const chars = '0123456789ABCDEF'.split('');
        const uuid = [];
        const rnd = Math.random;
        let r;
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';
        for (let i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | (rnd() * 16);
                uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r & 0xf];
            }
        }
        return uuid.join('');
    }
    static base64Encode(input) {
        return btoa(input);
    }
    static base64Decode(input) {
        return atob(input);
    }
    static base64UrlEncode(input) {
        const b64 = this.base64Encode(input);
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    static base64UrlDecode(input) {
        let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
        switch (b64.length % 4) {
            case 0:
                break;
            case 2:
                b64 += '==';
                break;
            case 3:
                b64 += '=';
                break;
            default:
                throw new Error('Invalid base64 string');
        }
        return this.base64Decode(b64);
    }
    static generateRandomString(length) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    static async generateCodeChallenge(code_verifier) {
        const sha = await this.SHA256(code_verifier);
        const shaString = String.fromCharCode.apply(null, sha);
        const code_challenge = this.base64UrlEncode(shaString);
        return code_challenge;
    }
    static async SHA256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray;
    }
}

class TokenUtils {
    static parseExpiresIn(expiresIn) {
        if (!expiresIn) {
            expiresIn = '3599';
        }
        return parseInt(expiresIn, 10);
    }
    static now() {
        return Math.round(new Date().getTime() / 1000.0);
    }
    static isEmpty(str) {
        return typeof str === 'undefined' || !str || 0 === str.length;
    }
    static getQueryParamFromUrl(url, key) {
        const tempStr = url.split(key + '=')[1];
        if (tempStr) {
            return tempStr.split('&')[0];
        }
        return '';
    }
    static urlDecode(s) {
        return s && s.replace ? decodeURIComponent(s.replace(/\+/g, ' ')) : '';
    }
    static decodeJwt(jwtToken) {
        if (TokenUtils.isEmpty(jwtToken)) {
            return null;
        }
        const idTokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
        const matches = idTokenPartsRegex.exec(jwtToken);
        if (!matches || matches.length < 4) {
            return null;
        }
        const crackedToken = {
            header: matches[1],
            JWSPayload: matches[2],
            JWSSig: matches[3]
        };
        return crackedToken;
    }
    static extractToken(encodedToken) {
        const decodedToken = this.decodeJwt(encodedToken);
        if (!decodedToken) {
            return null;
        }
        try {
            const base64Token = decodedToken.JWSPayload;
            const base64Decoded = CryptoUtils.base64UrlDecode(base64Token);
            if (!base64Decoded) {
                return null;
            }
            return JSON.parse(base64Decoded);
        }
        catch (err) { }
        return null;
    }
}

const TokenType$1 = {
    All: 0,
    AccessToken: 1,
    IdToken: 2
};
class OAuthToken {
    exp = 0;
    rawToken;
    claims = {};
    constructor(rawToken) {
        if (TokenUtils.isEmpty(rawToken)) {
            throw new Error('rawToken is empty');
        }
        this.rawToken = rawToken;
        try {
            this.claims = TokenUtils.extractToken(rawToken);
            if (this.claims && Object.prototype.hasOwnProperty.call(this.claims, 'exp')) {
                this.exp = +this.claims['exp'];
            }
        }
        catch (err) { }
    }
    isExpired() {
        return TokenUtils.now() > this.exp;
    }
}
class IdToken extends OAuthToken {
    iss = null;
    sub = null;
    aud = null;
    jti = null;
    nonce = null;
    iat = 0;
    constructor(rawToken) {
        super(rawToken);
        if (this.claims) {
            if (Object.prototype.hasOwnProperty.call(this.claims, 'iss')) {
                this.iss = this.claims['iss'];
            }
            if (Object.prototype.hasOwnProperty.call(this.claims, 'sub')) {
                this.sub = this.claims['sub'];
            }
            if (Object.prototype.hasOwnProperty.call(this.claims, 'aud')) {
                this.aud = this.claims['aud'];
            }
            if (Object.prototype.hasOwnProperty.call(this.claims, 'jti')) {
                this.jti = this.claims['jti'];
            }
            if (Object.prototype.hasOwnProperty.call(this.claims, 'iat')) {
                this.iat = +this.claims['iat'];
            }
            if (Object.prototype.hasOwnProperty.call(this.claims, 'nonce')) {
                this.nonce = this.claims['nonce'];
            }
        }
    }
}
class AccessToken extends OAuthToken {
    scope = null;
    client_id = null;
    username = null;
    employeeid = null;
    constructor(rawToken) {
        super(rawToken);
        if (this.claims) {
            if (Object.prototype.hasOwnProperty.call(this.claims, 'scope')) {
                this.scope = this.claims['scope'];
            }
            if (Object.prototype.hasOwnProperty.call(this.claims, 'client_id')) {
                this.client_id = this.claims['client_id'];
            }
            if (Object.prototype.hasOwnProperty.call(this.claims, 'employeeid')) {
                this.employeeid = this.claims['employeeid'];
            }
            if (Object.prototype.hasOwnProperty.call(this.claims, 'username')) {
                this.username = this.claims['username'];
            }
        }
    }
}

class OAuthTokenResponse {
    idToken = null;
    accessToken = null;
    refreshToken = null;
    state = null;
    constructor(idToken, accessToken, refreshToken, state) {
        this.idToken = idToken;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.state = state;
    }
    static BuildFromUrlString(responseString, expectedNonce, type = TokenType$1.All) {
        if (!responseString) {
            throw new Error('No response');
        }
        const errString = TokenUtils.urlDecode(TokenUtils.getQueryParamFromUrl(responseString, 'error'));
        const errDescString = TokenUtils.urlDecode(TokenUtils.getQueryParamFromUrl(responseString, 'error_description'));
        if (errString || errDescString) {
            throw new Error(errDescString || errString);
        }
        let idToken = null;
        if (type === TokenType$1.IdToken || type === TokenType$1.All) {
            const idTokenString = TokenUtils.getQueryParamFromUrl(responseString, 'id_token');
            if (!TokenUtils.isEmpty(idTokenString)) {
                idToken = new IdToken(idTokenString);
                if (idToken && expectedNonce && idToken.nonce !== expectedNonce) {
                    throw new Error('id token nounce does not match');
                }
            }
        }
        let accessToken = null;
        let refreshToken = null;
        if (type === TokenType$1.AccessToken || type === TokenType$1.All) {
            const accessTokenString = TokenUtils.getQueryParamFromUrl(responseString, 'access_token');
            if (!TokenUtils.isEmpty(accessTokenString)) {
                accessToken = new AccessToken(accessTokenString);
            }
            refreshToken = TokenUtils.getQueryParamFromUrl(responseString, 'refresh_token');
            if (TokenUtils.isEmpty(refreshToken)) {
                refreshToken = null;
            }
        }
        const state = TokenUtils.urlDecode(TokenUtils.getQueryParamFromUrl(responseString, 'state'));
        return new OAuthTokenResponse(idToken, accessToken, refreshToken, state);
    }
    static BuildFromJson(jsnObj, expectedNonce = null, state, type = TokenType$1.All) {
        if (!jsnObj) {
            throw new Error('Empty object.');
        }
        if (Object.prototype.hasOwnProperty.call(jsnObj, 'error')) {
            throw new Error('got error: ' + jsnObj['error']);
        }
        let idToken = null;
        if (Object.prototype.hasOwnProperty.call(jsnObj, 'id_token') && (type === TokenType$1.IdToken || type === TokenType$1.All)) {
            const idTokenString = jsnObj['id_token'];
            if (!TokenUtils.isEmpty(idTokenString)) {
                idToken = new IdToken(idTokenString);
                if (idToken && expectedNonce && idToken.nonce !== expectedNonce) {
                    throw new Error('id token nounce does not match');
                }
            }
        }
        let accessToken = null;
        let refreshToken = null;
        if (type === TokenType$1.AccessToken || type === TokenType$1.All) {
            if (Object.prototype.hasOwnProperty.call(jsnObj, 'access_token')) {
                const accessTokenString = jsnObj['access_token'];
                if (!TokenUtils.isEmpty(accessTokenString)) {
                    accessToken = new AccessToken(accessTokenString);
                }
            }
            if (Object.prototype.hasOwnProperty.call(jsnObj, 'refresh_token')) {
                refreshToken = jsnObj['refresh_token'];
            }
        }
        return new OAuthTokenResponse(idToken, accessToken, refreshToken, state);
    }
}

class OAuthCodeResponse {
    code = null;
    state = null;
    constructor(code, state) {
        this.code = code;
        this.state = state;
    }
    static BuildFromUrlString(responseString) {
        if (!responseString) {
            throw new Error('No response');
        }
        const errString = TokenUtils.urlDecode(TokenUtils.getQueryParamFromUrl(responseString, 'error'));
        const errDescString = TokenUtils.urlDecode(TokenUtils.getQueryParamFromUrl(responseString, 'error_description'));
        if (errString || errDescString) {
            throw new Error(errDescString || errString);
        }
        let code = null;
        const codeString = TokenUtils.getQueryParamFromUrl(responseString, 'code');
        if (!TokenUtils.isEmpty(codeString)) {
            code = codeString;
        }
        let state = TokenUtils.urlDecode(TokenUtils.getQueryParamFromUrl(responseString, 'state'));
        try {
            const stateObj = JSON.parse(state);
            if (stateObj.state !== undefined) {
                state = stateObj.state;
            }
        }
        catch (err) { }
        return new OAuthCodeResponse(code, state);
    }
}

class Cache {
    static get(key) {
        return sessionStorage.getItem(key);
    }
    static set(key, value) {
        sessionStorage.setItem(key, value);
    }
    static remove(key) {
        sessionStorage.removeItem(key);
    }
}

class WebUtils {
    static async HttpsPost(hostname, path, body) {
        return new Promise((resolve, reject) => {
            const url = `https://${hostname}${path}`;
            fetch(url, {
                method: 'post',
                headers: new Headers({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }),
                mode: 'cors',
                body: body
            })
                .then((response) => {
                if (response.status === 200) {
                    resolve(response.text());
                }
                else {
                    const msg = `Response statusCode is not 200. statusCode: ${response.status}
**** body ****  
${response.text()}`;
                    throw new Error(msg);
                }
            })
                .catch((ex) => {
                reject(ex);
            });
        });
    }
    static async HttpsGetRedirect(url) {
        const html = `
      <html>
        <head>
          <script>
            function signOn() {
              window.location.href = '${url}';
            }
            signOn();
          <\/script>
        </head>
        <body></body>
      </html>`;
        const iframe = DOMUtils.addHiddenIFrame('bbauth', html);
        if (!iframe || !iframe.contentWindow) {
            throw new Error('failed to access auth iframe');
        }
        const responseString = await DOMUtils.monitorWindowForPatterns(iframe.contentWindow, ['code', 'error'], 60000);
        DOMUtils.removeHiddenIframe(iframe);
        return responseString;
    }
}
class DOMUtils {
    static addHiddenIFrame(iframeId, srcdoc) {
        let iframe = document.getElementById(iframeId);
        if (!iframe) {
            if (document.documentElement &&
                window.navigator.userAgent.indexOf('MSIE 5.0') === -1) {
                const ifr = document.createElement('iframe');
                if (srcdoc !== undefined) {
                    ifr.srcdoc = srcdoc;
                }
                ifr.setAttribute('id', iframeId);
                ifr.style.visibility = 'hidden';
                ifr.style.position = 'absolute';
                ifr.style.width = ifr.style.height = '0';
                ifr.style.border = '0';
                ifr.setAttribute('sandbox', 'allow-scripts allow-same-origin');
                iframe = document.getElementsByTagName('body')[0].appendChild(ifr);
            }
            else if (document.body && document.body.insertAdjacentHTML) {
                document.body.insertAdjacentHTML('beforeend', "<iframe name='" + iframeId + "' id='" + iframeId + "' style='display:none'></iframe>");
            }
        }
        return iframe;
    }
    static removeHiddenIframe(iframe) {
        document.body.removeChild(iframe);
    }
    static async monitorWindowForHashOrError(contentWindow, timeout) {
        return DOMUtils.monitorWindowForPatterns(contentWindow, ['#', 'error'], timeout);
    }
    static monitorWindowForPatterns(contentWindow, patterns, timeout) {
        return new Promise((resolve, reject) => {
            const maxTicks = timeout / 100;
            let ticks = 0;
            const intervalId = setInterval(() => {
                if (contentWindow.closed) {
                    clearInterval(intervalId);
                    reject(new Error('User cancelled or window blocked'));
                }
                let href;
                try {
                    href = contentWindow.location.href;
                }
                catch (e) { }
                ticks++;
                if (!href || href === 'about:blank') {
                    return;
                }
                let found = false;
                for (const pattern of patterns) {
                    if (href.indexOf(pattern) > 0) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    clearInterval(intervalId);
                    resolve(href);
                }
                else if (ticks > maxTicks) {
                    clearInterval(intervalId);
                    reject(new Error('Timeout waiting for window location hash'));
                }
            }, 100);
        });
    }
}

const EnvType$1 = {
    Beta: 0,
    Prod: 1
};
class BssoUtils {
    static getBssoEnvType(envType) {
        if (envType === undefined) {
            return EnvType$1.Prod;
        }
        return envType;
    }
    static getBssoHost(envType) {
        let host = 'bsso';
        switch (envType) {
            case EnvType$1.Beta:
                host = 'bssobeta';
                break;
            case EnvType$1.Prod:
                host = 'bsso';
                break;
        }
        return host + '.blpprofessional.com';
    }
}

class BssoBridge {
    _useHfn = false;
    async getOAuthCode(oauthCodeParams, envType) {
        const html = `
    <html>
      <head>
        <script>
          function signOn() {
            const oauthParams = ${JSON.stringify(oauthCodeParams)};

            const clientId = "${oauthCodeParams.client_id}";
            const envType = ${envType};
            const _signOn = ${this._useHfn ? 'window.bb.apps.sso.oauth2SignInImplicit_' : 'window.bb.apps.auth.oauth2.signOnImplicit_'};
            const onSuccess = (url) => { window.location.href = url };
            const onError = (errCode, errMsg) => {
              console.error(errCode, errMsg);
              throw new Error(errMsg);
            };

            try {
              _signOn(onSuccess, onError, clientId, oauthParams, envType);
            } catch (err) {
              console.error("ERROR:> " + err.toString());
            }
          }

          signOn();
        <\/script>
      </head>
      <body></body>
    </html>`;
        const iframe = DOMUtils.addHiddenIFrame('bbauth', html);
        if (!iframe || !iframe.contentWindow) {
            throw new Error('failed to access auth iframe');
        }
        const responseString = await DOMUtils.monitorWindowForPatterns(iframe.contentWindow, ['code', 'error'], 60000);
        DOMUtils.removeHiddenIframe(iframe);
        return responseString;
    }
}

const logger = console;

class GetTokenResult {
    tokenResponse;
    refreshTokenInfo;
    constructor(tokenResponse, refreshTokenInfo) {
        this.tokenResponse = tokenResponse;
        this.refreshTokenInfo = refreshTokenInfo;
    }
}
let OAuth2$1 = class OAuth2 {
    _useHfn;
    _bssoBridge;
    _pendingRequests = {};
    constructor() {
        this._useHfn = false;
        this._bssoBridge = new BssoBridge();
    }
    async getTokens(signOnParams) {
        let tokenResponse = null;
        OAuth2$1.validateSignOnParamsGetTokens(signOnParams);
        try {
            if (!signOnParams.noCache) {
                const cachedTokenResponse = Cache.get(OAuth2$1.GetCacheKey('OAuthTokenResponse', signOnParams.scopes, signOnParams.clientId));
                if (cachedTokenResponse) {
                    const jsonToken = JSON.parse(cachedTokenResponse);
                    tokenResponse = OAuthTokenResponse.BuildFromJson(jsonToken, undefined, signOnParams.state, signOnParams.tokenType);
                    if (tokenResponse && tokenResponse.idToken && tokenResponse.idToken.isExpired()) {
                        tokenResponse = null;
                    }
                    else if (tokenResponse && tokenResponse.accessToken && tokenResponse.accessToken.isExpired()) {
                        tokenResponse = await this.refreshToken(signOnParams, jsonToken);
                    }
                }
            }
        }
        catch (err) {
            tokenResponse = null;
            logger.warn(`Get tokens from cache failed: ${err}`);
        }
        if (!tokenResponse) {
            const reqKey = OAuth2$1.GetCacheKey('pendingRequest', signOnParams.scopes, signOnParams.clientId);
            const p = this.checkPendingRequest(reqKey);
            if (p !== null) {
                return p;
            }
            try {
                const result = await this.getTokensFromBsso(signOnParams);
                tokenResponse = result.tokenResponse;
                Cache.set(OAuth2$1.GetCacheKey('RefreshTokenInfo', signOnParams.scopes, signOnParams.clientId), JSON.stringify(result.refreshTokenInfo));
                this.resolvePendingRequests(reqKey, tokenResponse);
            }
            catch (err) {
                logger.error(`Get tokens failed: ${err}`);
                this.rejectPendingRequests(reqKey, err);
                return Promise.reject(err);
            }
        }
        return tokenResponse;
    }
    async refreshToken(signOnParams, prevResponse) {
        let tokenResponse = null;
        try {
            const refreshTokenInfoString = Cache.get(OAuth2$1.GetCacheKey('RefreshTokenInfo', signOnParams.scopes, signOnParams.clientId));
            if (refreshTokenInfoString) {
                const refreshTokenInfo = JSON.parse(refreshTokenInfoString);
                if (refreshTokenInfo) {
                    logger.info('Refreshing token...');
                    const params = {
                        grant_type: 'refresh_token',
                        refresh_token: prevResponse['refresh_token'],
                        client_id: signOnParams.clientId,
                        client_secret: signOnParams.clientSecret
                    };
                    tokenResponse = await this.getTokenResponse(signOnParams, refreshTokenInfo.tokenEndPoint, params, refreshTokenInfo.nonce, signOnParams.state, prevResponse);
                }
            }
        }
        catch (err) {
            logger.warn(`Refresh token failed: ${err}`);
            tokenResponse = null;
        }
        return tokenResponse;
    }
    checkPendingRequest(key) {
        const pending = this._pendingRequests[key];
        if (pending === undefined) {
            this._pendingRequests[key] = [];
            return null;
        }
        else {
            logger.info(`Same bsso getTokens request is already in progress, add to pending queue .. (request key: '${key}')`);
            return new Promise((resolve, reject) => {
                pending.push({ resolve: resolve, reject: reject });
            });
        }
    }
    resolvePendingRequests(key, tokenResponse) {
        const pending = this._pendingRequests[key];
        if (pending && pending.length > 0) {
            logger.info(`resolving ${pending.length} pending getTokens requests (request key: '${key}')`);
            pending.forEach((value) => {
                value.resolve(tokenResponse);
            });
        }
        delete this._pendingRequests[key];
    }
    rejectPendingRequests(key, err) {
        const pending = this._pendingRequests[key];
        if (pending && pending.length > 0) {
            logger.info(`rejecting ${pending.length} pending getTokens requests (request key: '${key}')`);
            pending.forEach((value) => {
                value.reject(err);
            });
        }
        delete this._pendingRequests[key];
    }
    async getTokensFromBsso(signOnParams) {
        logger.info('Getting Tokens from BSSO ...');
        const nonce = signOnParams.nonce || CryptoUtils.generateRandomString(20);
        const codeVerifier = CryptoUtils.generateRandomString(43);
        const codeChallenge = await CryptoUtils.generateCodeChallenge(codeVerifier);
        const oauthCodeParam = {
            client_id: signOnParams.clientId,
            scope: signOnParams.scopes.join(' '),
            response_type: 'code',
            redirect_uri: signOnParams.redirectURI,
            state: signOnParams.state,
            nonce: nonce,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        };
        const codeResponseString = await this._bssoBridge.getOAuthCode(oauthCodeParam, BssoUtils.getBssoEnvType(signOnParams.envType));
        logger.info(`Got code response: ${codeResponseString}`);
        const codeResponse = OAuthCodeResponse.BuildFromUrlString(codeResponseString);
        const bssoHost = BssoUtils.getBssoHost(signOnParams.envType);
        const oauthTokenParams = {
            grant_type: 'authorization_code',
            code: codeResponse.code,
            client_id: signOnParams.clientId,
            client_secret: signOnParams.clientSecret,
            redirect_uri: signOnParams.redirectURI,
            code_verifier: oauthCodeParam.code_verifier || codeVerifier
        };
        const tokenResponse = await this.getTokenResponse(signOnParams, bssoHost, oauthTokenParams, oauthCodeParam.nonce, codeResponse.state);
        const refreshTokenInfo = {
            tokenEndPoint: bssoHost,
            nonce: oauthCodeParam.nonce
        };
        return new GetTokenResult(tokenResponse, refreshTokenInfo);
    }
    async getTokenResponse(signOnParams, endPoint, params, nonce, state, prevResponse) {
        const body = Object.keys(params)
            .map((key) => key + '=' + encodeURIComponent(params[key]))
            .join('&');
        let response = await WebUtils.HttpsPost(endPoint, '/as/token.oauth2', body);
        logger.info(`Got token response: ${JSON.stringify(response)}`);
        const responseJson = JSON.parse(response);
        if (prevResponse && Object.prototype.hasOwnProperty.call(prevResponse, 'id_token') && !Object.prototype.hasOwnProperty.call(responseJson, 'id_token')) {
            responseJson['id_token'] = prevResponse['id_token'];
            response = JSON.stringify(responseJson);
        }
        const tokenResponse = OAuthTokenResponse.BuildFromJson(responseJson, nonce, state, signOnParams.tokenType);
        Cache.set(OAuth2$1.GetCacheKey('OAuthTokenResponse', signOnParams.scopes, signOnParams.clientId), response);
        return tokenResponse;
    }
    static validateSignOnParamsGetTokens(signOnParams) {
        if (!signOnParams.clientId) {
            throw new Error('signOnParams.clientId is empty');
        }
        if (!signOnParams.scopes) {
            logger.info('signOnParams.scopes is empty, use default ["openid", "profile"]');
            signOnParams.scopes = ['openid', 'profile'];
        }
        if (!signOnParams.redirectURI) {
            throw new Error('signOnParams.redirectURI is empty');
        }
        if (signOnParams.envType === undefined) {
            logger.info('signOnParam.envType is empty, use default EnvType.Prod');
            signOnParams.envType = EnvType$1.Prod;
        }
        if (signOnParams.tokenType === undefined) {
            signOnParams.tokenType = TokenType$1.All;
        }
    }
    static GetCacheKey(name, scopes, clientId) {
        return (clientId || '') + '|' + name + '|' + OAuth2$1.NormalizeScopes(scopes);
    }
    static NormalizeScopes(scopes) {
        if (!scopes || !(scopes.length > 0) || !scopes.filter) {
            return '';
        }
        scopes = scopes.filter((s) => s && s.trim).map((s) => s.trim());
        return scopes.join(' ');
    }
};

class OAuth2 {
    _useHfn = false;
    _pkceImpl = new OAuth2$1();
    constructor() {
    }
    async signOn(signOnParams) {
        const oauthParams = {
            "client_id": signOnParams.clientId,
            "scope": signOnParams.scopes.join(' '),
            "response_type": 'code',
            "redirect_uri": signOnParams.redirectURI,
            "state": signOnParams.state,
            "nonce": signOnParams.nonce || CryptoUtils.generateRandomString(20)
        };
        return new Promise((resolve, reject) => {
            if (this._useHfn) {
                window.bb.apps.sso.oauth2SignIn((errCode, errMsg) => {
                    reject(new Error(errMsg));
                }, signOnParams.clientId, oauthParams, signOnParams.envType);
            }
            else {
                window.bb.apps.auth.oauth2.signOn((errCode, errMsg) => {
                    reject(new Error(errMsg));
                }, signOnParams.clientId, oauthParams, signOnParams.envType);
            }
        });
    }
    async getTokens(signOnParams) {
        let resp = await this._pkceImpl.getTokens(signOnParams);
        return new OAuthTokenResponse$1(resp.idToken, resp.accessToken, resp.state);
    }
}

class Saml2 {
    signOn(entityId, acsIndex, relayState, envType) {
        return new Promise((resolve, reject) => {
            window.bb.apps.auth.saml.signOn((errCode, errMsg) => {
                reject(new Error(errMsg));
            }, entityId, acsIndex, relayState, envType);
        });
    }
}

var EnvType;
(function (EnvType) {
    EnvType[EnvType["Prod"] = 1] = "Prod";
    EnvType[EnvType["Beta"] = 0] = "Beta";
})(EnvType || (EnvType = {}));
var TokenType;
(function (TokenType) {
    TokenType[TokenType["All"] = 0] = "All";
    TokenType[TokenType["AccessToken"] = 1] = "AccessToken";
    TokenType[TokenType["IdToken"] = 2] = "IdToken";
})(TokenType || (TokenType = {}));
class OAuth2SignOnParams {
    clientId = "";
    clientSecret = "";
    scopes = [];
    redirectURI = "";
    state = "";
    nonce = "";
    envType = EnvType.Prod;
    tokenType = TokenType.All;
    noCache = false;
}

class GlobalAuthentication {
    Saml2;
    OAuth2;
    constructor() {
        this.Saml2 = new Saml2();
        this.OAuth2 = new OAuth2();
    }
}
var index = (function () {
    window.BB = window.BB || {};
    window.BB.Apps = window.BB.Apps || {};
    window.BB.Apps.Auth = window.BB.Apps.Auth || new GlobalAuthentication();
    return window.BB.Apps.Auth;
})();

export { EnvType, OAuth2SignOnParams, index as default };
