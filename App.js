import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Vibration,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as Network from 'expo-network';
import { WebView } from 'react-native-webview';
import html from './gamepadHtml';
import * as xb from './xbox';

export default function App() {
  const web = useRef(null);
  const waiters = useRef({});
  const apiRef = useRef(null);
  const sessRef = useRef(null);
  const keepRef = useRef(null);
  const cancelRef = useRef(false);
  const phaseRef = useRef('boot');

  const [phase, setPhaseState] = useState('boot');
  const [msg, setMsg] = useState('');
  const [code, setCode] = useState(null);
  const [consoles, setConsoles] = useState([]);

  const setPhase = (p) => {
    phaseRef.current = p;
    setPhaseState(p);
  };

  const js = (script) => {
    if (web.current) web.current.injectJavaScript(script + '\ntrue;');
  };
  const setStatus = (text, ok) => js('window.XbStatus(' + JSON.stringify(text) + ',' + (ok ? 'true' : 'false') + ')');

  const waitMsg = (type, ms) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        delete waiters.current[type];
        reject(new Error('انتهت المهلة (' + type + ')'));
      }, ms);
      waiters.current[type] = (v) => {
        clearTimeout(t);
        delete waiters.current[type];
        resolve(v);
      };
    });

  const stopKeepalive = () => {
    if (keepRef.current) {
      clearInterval(keepRef.current);
      keepRef.current = null;
    }
  };

  const hangup = useCallback(() => {
    stopKeepalive();
    js('window.XbRtc.stop()');
    const s = sessRef.current;
    const api = apiRef.current;
    if (s && api) api.stop(s.path).catch(() => {});
    sessRef.current = null;
    setStatus('غير متصل · اضغط هنا', false);
  }, []);

  const loadConsoles = async (accessToken) => {
    setPhase('loading');
    setMsg('جاري تحميل أجهزة الـ Xbox…');
    const session = await xb.getStreamingSession(accessToken);
    apiRef.current = new xb.XhomeApi(session);
    const list = await apiRef.current.consoles();
    setConsoles(list);
    setPhase('consoles');
  };

  const showError = (e) => {
    setMsg(String((e && e.message) || e));
    setPhase('error');
  };

  // ----- boot: try silent login with the saved token -----
  useEffect(() => {
    (async () => {
      try {
        const tok = await xb.refreshLogin();
        if (tok) await loadConsoles(tok.access_token);
        else setPhase('login');
      } catch (e) {
        setPhase('login');
      }
    })();
    (async () => {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
      } catch (e) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogin = async () => {
    cancelRef.current = false;
    try {
      setMsg('');
      const dc = await xb.startDeviceLogin();
      setCode(dc);
      const tok = await xb.pollDeviceLogin(dc, () => cancelRef.current);
      setCode(null);
      await loadConsoles(tok.access_token);
    } catch (e) {
      setCode(null);
      if (!cancelRef.current) showError(e);
    }
  };

  const cancelLogin = () => {
    cancelRef.current = true;
    setCode(null);
  };

  const doLogout = async () => {
    hangup();
    await xb.logout();
    apiRef.current = null;
    setConsoles([]);
    setPhase('login');
  };

  const connect = async (c) => {
    cancelRef.current = false;
    setPhase('connecting');
    try {
      const api = apiRef.current;
      setMsg('جاري إنشاء الجلسة…');
      const s = await api.start(c.serverId);
      sessRef.current = s;

      setMsg('الـ Xbox بيجهّز الاتصال… (ممكن ياخد لحد دقيقة لو كان في Sleep)');
      await api.waitReady(s.path, () => cancelRef.current);

      setMsg('جاري الاتصال…');
      const offerP = waitMsg('offer', 15000);
      js('window.XbRtc.start()');
      const offer = await offerP;

      const answer = await api.sendOffer(s.path, offer, () => cancelRef.current);
      js('window.XbRtc.setAnswer(' + JSON.stringify(answer) + ')');

      let ip = '';
      try {
        ip = await Network.getIpAddressAsync();
      } catch (e) {}
      const iceP = waitMsg('ice', 15000);
      js('window.XbRtc.sendIce(' + JSON.stringify(ip) + ')');
      const local = await iceP;

      const remote = await api.sendIce(s.path, local, () => cancelRef.current);
      const readyP = waitMsg('ready', 30000);
      js('window.XbRtc.addIce(' + JSON.stringify(remote) + ')');
      await readyP;

      stopKeepalive();
      keepRef.current = setInterval(() => {
        api.keepalive(s.path).catch(() => {});
      }, 30000);

      setStatus('متصل ✓', true);
      setPhase('connected');
    } catch (e) {
      hangup();
      if (cancelRef.current) setPhase('consoles');
      else showError(e);
    }
  };

  const onMessage = (e) => {
    let m;
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch (err) {
      return;
    }
    switch (m.t) {
      case 'buzz':
        Vibration.vibrate(m.ms || 12);
        break;
      case 'menu': {
        const p = phaseRef.current;
        if (p === 'connected') setPhase('menu');
        else if (p === 'demo') setPhase(apiRef.current ? 'consoles' : 'login');
        break;
      }
      case 'offer':
        if (waiters.current.offer) waiters.current.offer(m.sdp);
        break;
      case 'ice':
        if (waiters.current.ice) waiters.current.ice(m.candidates);
        break;
      case 'rtc':
        if (m.state === 'ready') {
          if (waiters.current.ready) waiters.current.ready(true);
        } else if (m.state === 'failed' || m.state === 'closed' || m.state === 'disconnected') {
          if (phaseRef.current === 'connected' || phaseRef.current === 'menu') {
            hangup();
            setMsg('انقطع الاتصال بالـ Xbox.');
            setPhase('error');
          }
        }
        break;
      case 'rtcerr':
        if (phaseRef.current === 'connecting') {
          if (waiters.current.offer) delete waiters.current.offer;
          hangup();
          showError(new Error('خطأ WebRTC: ' + m.msg));
        }
        break;
      default:
    }
  };

  // ----- overlay UI -----
  const Btn = ({ title, onPress, dim }) => (
    <TouchableOpacity style={[styles.btn, dim && styles.btnDim]} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.btnText}>{title}</Text>
    </TouchableOpacity>
  );

  let overlay = null;
  if (phase === 'boot' || phase === 'loading') {
    overlay = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2fd12f" />
        <Text style={styles.text}>{msg || 'جاري التحميل…'}</Text>
      </View>
    );
  } else if (phase === 'login') {
    overlay = code ? (
      <View style={styles.center}>
        <Text style={styles.text}>افتح الصفحة دي، وادخل الكود ده:</Text>
        <Text style={styles.code}>{code.user_code}</Text>
        <Btn title="فتح صفحة تسجيل الدخول" onPress={() => Linking.openURL(code.verification_uri)} />
        <Text style={styles.small}>{code.verification_uri}</Text>
        <ActivityIndicator color="#2fd12f" />
        <Btn title="إلغاء" dim onPress={cancelLogin} />
      </View>
    ) : (
      <View style={styles.center}>
        <Text style={styles.title}>Xb Pad</Text>
        <Text style={styles.text}>سجّل دخول بحساب Microsoft اللي عليه الـ Xbox</Text>
        <Btn title="تسجيل الدخول" onPress={doLogin} />
        <Btn title="تجربة الواجهة بدون اتصال" dim onPress={() => setPhase('demo')} />
      </View>
    );
  } else if (phase === 'consoles') {
    overlay = (
      <View style={styles.center}>
        <Text style={styles.title}>اختار الـ Xbox</Text>
        <ScrollView style={{ maxHeight: 150, alignSelf: 'stretch' }} contentContainerStyle={{ alignItems: 'center' }}>
          {consoles.length === 0 ? (
            <Text style={styles.text}>مفيش أجهزة على الحساب ده. فعّل Remote features على الـ Xbox.</Text>
          ) : (
            consoles.map((c) => (
              <Btn key={c.serverId} title={c.deviceName + '  ·  ' + c.powerState} onPress={() => connect(c)} />
            ))
          )}
        </ScrollView>
        <View style={styles.row}>
          <Btn title="تحديث" dim onPress={async () => {
            try {
              setConsoles(await apiRef.current.consoles());
            } catch (e) {
              showError(e);
            }
          }} />
          <Btn title="تجربة الواجهة" dim onPress={() => setPhase('demo')} />
          <Btn title="تسجيل خروج" dim onPress={doLogout} />
        </View>
      </View>
    );
  } else if (phase === 'connecting') {
    overlay = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2fd12f" />
        <Text style={styles.text}>{msg}</Text>
        <Btn title="إلغاء" dim onPress={() => { cancelRef.current = true; hangup(); setPhase('consoles'); }} />
      </View>
    );
  } else if (phase === 'menu') {
    overlay = (
      <View style={styles.center}>
        <Text style={styles.title}>متصل بالـ Xbox</Text>
        <View style={styles.row}>
          <Btn title="رجوع للدراع" onPress={() => setPhase('connected')} />
          <Btn title="قطع الاتصال" dim onPress={() => { hangup(); setPhase('consoles'); }} />
        </View>
      </View>
    );
  } else if (phase === 'error') {
    overlay = (
      <View style={styles.center}>
        <Text style={styles.title}>حصلت مشكلة</Text>
        <Text style={styles.text}>{msg}</Text>
        <View style={styles.row}>
          <Btn title="رجوع" onPress={() => setPhase(apiRef.current ? 'consoles' : 'login')} />
        </View>
      </View>
    );
  }

  const showOverlay = overlay !== null;

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <WebView
        ref={web}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onMessage={onMessage}
      />
      {showOverlay && <View style={styles.overlay}>{overlay}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050505' },
  web: { flex: 1, backgroundColor: '#050505' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,5,5,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  center: { alignItems: 'center', justifyContent: 'center', maxWidth: 520, alignSelf: 'center' },
  title: { color: '#2fd12f', fontSize: 26, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  text: { color: '#cfe', fontSize: 16, textAlign: 'center', marginVertical: 8 },
  small: { color: '#6a9a6a', fontSize: 12, marginBottom: 8 },
  code: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: 4, marginVertical: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  btn: {
    backgroundColor: '#107c10',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    margin: 5,
  },
  btnDim: { backgroundColor: '#1d2d1d' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
