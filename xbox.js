// Xbox login + Remote Play (xHome) session API.
// Flow and endpoints follow the open-source xal-node and xbox-xcloud-player projects.
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLIENT_ID = '1f907974-e22b-4810-a9de-d9647380c97e';
const SCOPE = 'xboxlive.signin openid profile offline_access';
const TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
const DEVICECODE_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode';
const STORE_KEY = 'xbpad.refresh_token';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function form(obj) {
  return Object.keys(obj)
    .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]))
    .join('&');
}

async function readJson(res) {
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {}
  return { ok: res.ok, status: res.status, json, text };
}

async function postForm(url, obj) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form(obj),
  });
  return readJson(res);
}

async function postJson(url, body, headers) {
  const res = await fetch(url, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json' }, headers || {}),
    body: JSON.stringify(body),
  });
  return readJson(res);
}

// ---------- Microsoft login (device code) ----------

export async function startDeviceLogin() {
  const r = await postForm(DEVICECODE_URL, { client_id: CLIENT_ID, scope: SCOPE });
  if (!r.ok || !r.json || !r.json.device_code) {
    throw new Error('فشل بدء تسجيل الدخول (' + r.status + ')');
  }
  return r.json; // user_code, device_code, verification_uri, expires_in, interval
}

export async function pollDeviceLogin(dc, cancelled) {
  const deadline = Date.now() + (dc.expires_in || 900) * 1000;
  const interval = Math.max(2, dc.interval || 5) * 1000;
  while (Date.now() < deadline) {
    if (cancelled && cancelled()) throw new Error('تم الإلغاء');
    await sleep(interval);
    const r = await postForm(TOKEN_URL, {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: CLIENT_ID,
      device_code: dc.device_code,
    });
    if (r.ok && r.json && r.json.access_token) {
      if (r.json.refresh_token) await AsyncStorage.setItem(STORE_KEY, r.json.refresh_token);
      return r.json;
    }
    const err = r.json && r.json.error;
    if (err && err !== 'authorization_pending' && err !== 'slow_down') {
      throw new Error('فشل تسجيل الدخول: ' + err);
    }
  }
  throw new Error('انتهت مهلة تسجيل الدخول');
}

export async function refreshLogin() {
  const rt = await AsyncStorage.getItem(STORE_KEY);
  if (!rt) return null;
  const r = await postForm(TOKEN_URL, {
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: rt,
    scope: SCOPE,
  });
  if (r.ok && r.json && r.json.access_token) {
    if (r.json.refresh_token) await AsyncStorage.setItem(STORE_KEY, r.json.refresh_token);
    return r.json;
  }
  return null;
}

export async function logout() {
  await AsyncStorage.removeItem(STORE_KEY);
}

// ---------- Xbox Live tokens -> xHome streaming token ----------

const XERR = {
  2148916233: 'الحساب ده مفيهوش Xbox profile. افتح تطبيق Xbox وسجّل مرة.',
  2148916235: 'خدمة Xbox غير متاحة في بلدك.',
  2148916238: 'حساب طفل. لازم يتضاف لعيلة Microsoft.',
};

export async function getStreamingSession(accessToken) {
  const u = await postJson(
    'https://user.auth.xboxlive.com/user/authenticate',
    {
      Properties: { AuthMethod: 'RPS', RpsTicket: 'd=' + accessToken, SiteName: 'user.auth.xboxlive.com' },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT',
    },
    { 'x-xbl-contract-version': '1' }
  );
  if (!u.ok || !u.json || !u.json.Token) throw new Error('فشل Xbox Live auth (' + u.status + ')');

  const x = await postJson(
    'https://xsts.auth.xboxlive.com/xsts/authorize',
    {
      Properties: { SandboxId: 'RETAIL', UserTokens: [u.json.Token] },
      RelyingParty: 'http://gssv.xboxlive.com/',
      TokenType: 'JWT',
    },
    { 'x-xbl-contract-version': '1', Origin: 'https://www.xbox.com', Referer: 'https://www.xbox.com/' }
  );
  if (!x.ok || !x.json || !x.json.Token) {
    const code = x.json && x.json.XErr;
    throw new Error(XERR[code] || 'فشل XSTS (' + x.status + (code ? ', ' + code : '') + ')');
  }

  const g = await postJson(
    'https://xhome.gssv-play-prod.xboxlive.com/v2/login/user',
    { token: x.json.Token, offeringId: 'xhome' },
    { 'x-gssv-client': 'XboxComBrowser' }
  );
  if (!g.ok || !g.json || !g.json.gsToken) throw new Error('فشل تسجيل الدخول لخدمة الـ Remote Play (' + g.status + ')');

  const regions = (g.json.offeringSettings && g.json.offeringSettings.regions) || [];
  const region = regions.find((r) => r.isDefault) || regions[0];
  if (!region) throw new Error('مفيش سيرفر متاح للـ Remote Play');
  return { gsToken: g.json.gsToken, host: region.baseUri.replace(/\/$/, '') };
}

// ---------- xHome session API ----------

function deviceInfo() {
  return JSON.stringify({
    appInfo: {
      env: {
        clientAppId: 'www.xbox.com',
        clientAppType: 'browser',
        clientAppVersion: '21.1.98',
        clientSdkVersion: '8.5.3',
        httpEnvironment: 'prod',
        sdkInstallId: '',
      },
    },
    dev: {
      hw: { make: 'Microsoft', model: 'unknown', sdktype: 'web' },
      os: { name: 'windows', ver: '22631.2715', platform: 'desktop' },
      displayInfo: {
        dimensions: { widthInPixels: 1920, heightInPixels: 1080 },
        pixelDensity: { dpiX: 2, dpiY: 2 },
      },
      browser: { browserName: 'chrome', browserVersion: '119.0' },
    },
  });
}

function parseExchange(r) {
  const ex = r.json && r.json.exchangeResponse;
  if (ex === undefined || ex === null) return null;
  return typeof ex === 'string' ? JSON.parse(ex) : ex;
}

export class XhomeApi {
  constructor(session) {
    this.host = session.host;
    this.token = session.gsToken;
    this.deviceInfo = deviceInfo();
  }

  headers() {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Gssv-Client': 'XboxComBrowser',
      'X-MS-Device-Info': this.deviceInfo,
      Authorization: 'Bearer ' + this.token,
    };
  }

  async req(method, path, body) {
    const res = await fetch(this.host + path, {
      method,
      headers: this.headers(),
      body: body === undefined ? undefined : body,
    });
    return readJson(res);
  }

  async consoles() {
    const r = await this.req('GET', '/v6/servers/home');
    if (!r.ok) throw new Error('فشل تحميل الأجهزة (' + r.status + ')');
    return (r.json && r.json.results) || [];
  }

  async start(serverId) {
    const body = JSON.stringify({
      clientSessionId: '',
      titleId: '',
      systemUpdateGroup: '',
      settings: {
        nanoVersion: 'V3;WebrtcTransport.dll',
        enableOptionalDataCollection: false,
        enableTextToSpeech: false,
        highContrast: 0,
        locale: 'en-US',
        useIceConnection: false,
        timezoneOffsetMinutes: -new Date().getTimezoneOffset(),
        sdkType: 'web',
        osName: 'windows',
      },
      serverId,
      fallbackRegionNames: [],
    });
    const r = await this.req('POST', '/v5/sessions/home/play', body);
    if (!r.ok || !r.json || !r.json.sessionPath) {
      const d = r.json && (r.json.errorDetails || r.json.message || r.json.errorCode);
      throw new Error('فشل بدء الجلسة (' + r.status + ')' + (d ? ': ' + (typeof d === 'string' ? d : JSON.stringify(d)) : ''));
    }
    return { id: r.json.sessionId, path: '/' + r.json.sessionPath };
  }

  async waitReady(path, cancelled) {
    for (let i = 0; i < 120; i++) {
      if (cancelled && cancelled()) throw new Error('تم الإلغاء');
      const r = await this.req('GET', path + '/state');
      const st = r.json && r.json.state;
      if (st === 'Provisioned' || st === 'ReadyToConnect') return st;
      if (st === 'Failed' || st === 'Error') {
        const d = r.json && r.json.errorDetails;
        throw new Error('الـ Xbox رفض الجلسة' + (d && d.message ? ': ' + d.message : ''));
      }
      await sleep(1000);
    }
    throw new Error('الـ Xbox مردّش. تأكد إنه شغال أو في Sleep وRemote features مفعّل.');
  }

  async sendOffer(path, sdp, cancelled) {
    const body = JSON.stringify({
      messageType: 'offer',
      sdp,
      requestId: '1',
      configuration: {
        chatConfiguration: {
          bytesPerSample: 2,
          expectedClipDurationMs: 20,
          format: { codec: 'opus', container: 'webm' },
          numChannels: 1,
          sampleFrequencyHz: 24000,
        },
        chat: { minVersion: 1, maxVersion: 1 },
        control: { minVersion: 1, maxVersion: 3 },
        input: { minVersion: 1, maxVersion: 9 },
        message: { minVersion: 1, maxVersion: 1 },
        reliableinput: { minVersion: 9, maxVersion: 9 },
        unreliableinput: { minVersion: 9, maxVersion: 9 },
      },
    });
    const p = await this.req('POST', path + '/sdp', body);
    if (!p.ok) throw new Error('فشل إرسال SDP (' + p.status + ')');
    for (let i = 0; i < 80; i++) {
      if (cancelled && cancelled()) throw new Error('تم الإلغاء');
      const r = await this.req('GET', path + '/sdp');
      if (r.ok && r.status !== 204) {
        const ex = parseExchange(r);
        if (ex && ex.sdp) return ex.sdp;
      }
      await sleep(500);
    }
    throw new Error('مفيش رد من الـ Xbox على SDP');
  }

  async sendIce(path, candidates, cancelled) {
    const p = await this.req('POST', path + '/ice', JSON.stringify({ candidates }));
    if (!p.ok) throw new Error('فشل إرسال ICE (' + p.status + ')');
    for (let i = 0; i < 40; i++) {
      if (cancelled && cancelled()) throw new Error('تم الإلغاء');
      const r = await this.req('GET', path + '/ice');
      if (r.ok && r.status !== 204) {
        const ex = parseExchange(r);
        if (ex) return Array.isArray(ex) ? ex : [];
      }
      await sleep(1000);
    }
    throw new Error('مفيش رد من الـ Xbox على ICE');
  }

  keepalive(path) {
    return this.req('POST', path + '/keepalive', '');
  }

  stop(path) {
    return this.req('DELETE', path);
  }
}
