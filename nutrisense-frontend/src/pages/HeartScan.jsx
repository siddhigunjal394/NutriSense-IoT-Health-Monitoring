import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { addHealthData } from '../services/api';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';

const MEDIAPIPE_URL = 'http://localhost:5001';
const SCAN_DURATION = 30;
const FRAME_INTERVAL_MS = 150; // send a frame every 150ms (~6-7 fps to server)

export default function HeartScan() {
  const { user } = useAuth();

  const [phase, setPhase]                 = useState('idle');
  const [progress, setProgress]           = useState(0);
  const [countdown, setCountdown]         = useState(SCAN_DURATION);
  const [framesCapture, setFramesCapture] = useState(0);
  const [faceDetected, setFaceDetected]   = useState(false);
  const [result, setResult]               = useState(null);
  const [camError, setCamError]           = useState('');
  const [toast, setToast]                 = useState({ show: false, message: '', type: 'success' });

  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const streamRef     = useRef(null);
  const pollRef       = useRef(null);   // status polling
  const frameRef      = useRef(null);   // frame sending interval
  const timerRef      = useRef(null);   // countdown timer
  const startTimeRef  = useRef(null);
  const doneRef       = useRef(false);
  const sendingRef    = useRef(false);  // prevent overlapping frame sends

  const showToast = (msg, type = 'success') =>
    setToast({ show: true, message: msg, type });

  // ── Camera ────────────────────────────────────────────────────
  const startCamera = async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      return stream;
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera in browser settings.' :
        err.name === 'NotFoundError'   ? 'No camera found on this device.' :
        'Camera error: ' + err.message;
      setCamError(msg);
      showToast(msg, 'error');
      return null;
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Attach stream to video when scanning starts
  useEffect(() => {
    if (phase === 'scanning' && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [phase]);

  // ── Capture & send one frame to Python server ─────────────────
  const sendFrame = useCallback(async () => {
    if (sendingRef.current) return; // skip if previous send still in flight
    if (!videoRef.current || !canvasRef.current) return;
    if (videoRef.current.readyState < 2) return; // video not ready

    sendingRef.current = true;
    try {
      const canvas = canvasRef.current;
      const ctx    = canvas.getContext('2d');
      canvas.width  = videoRef.current.videoWidth  || 320;
      canvas.height = videoRef.current.videoHeight || 240;

      // Mirror-flip for correct face orientation
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Compress to JPEG (quality 0.6 is enough for rPPG)
      const base64 = canvas.toDataURL('image/jpeg', 0.6);

      const res  = await fetch(`${MEDIAPIPE_URL}/process-frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: base64 }),
      });
      const data = await res.json();

      if (data.status === 'complete') {
        // Server finished during frame processing — trigger final poll
        return;
      }

      setFaceDetected(!!data.face_detected);
      setFramesCapture(data.frames_captured || 0);
      setProgress(data.progress || 0);
    } catch (e) {
      // Server temporarily unreachable — keep going
    } finally {
      sendingRef.current = false;
    }
  }, []);

  // ── Timer (local UI countdown) ────────────────────────────────
  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed   = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, SCAN_DURATION - elapsed);
      setCountdown(Math.ceil(remaining));
    }, 200);
  };

  // ── Poll /scan-status to detect completion ────────────────────
  const startPolling = () => {
    doneRef.current = false;
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${MEDIAPIPE_URL}/scan-status`);
        const data = await res.json();

        setFramesCapture(data.frames_captured || 0);
        setFaceDetected(!!data.face_detected);
        setProgress(data.progress || 0);

        if (!data.scanning && data.progress >= 100 && !doneRef.current) {
          doneRef.current = true;
          clearInterval(pollRef.current);
          clearInterval(frameRef.current);
          clearInterval(timerRef.current);
          setProgress(100);
          setCountdown(0);

          if (data.heart_rate) {
            await finishScan(data.heart_rate, data);
          } else {
            stopCamera();
            setPhase('idle');
            showToast('❌ ' + (data.error || 'Could not detect heart rate. Try again.'), 'error');
          }
        }
      } catch (e) { /* server unreachable */ }
    }, 800);
  };

  // ── Start scan ────────────────────────────────────────────────
  const startScan = async () => {
    setResult(null);
    setProgress(0);
    setCountdown(SCAN_DURATION);
    setFramesCapture(0);
    setFaceDetected(false);
    doneRef.current  = false;
    sendingRef.current = false;

    const stream = await startCamera();
    if (!stream) return;

    // Tell server to start
    try {
      const res = await fetch(`${MEDIAPIPE_URL}/start-scan`, { method: 'POST' });
      if (!res.ok) throw new Error('server error');
    } catch (_) {
      showToast('⚠️ MediaPipe server not running! Run: python mediapipe_server.py', 'error');
      stopCamera();
      return;
    }

    setPhase('scanning');
    showToast('📷 Scan started! Centre your face in the frame.', 'success');
    startTimer();

    // Wait a tick for video element to mount, then start sending frames
    setTimeout(() => {
      frameRef.current = setInterval(sendFrame, FRAME_INTERVAL_MS);
      startPolling();
    }, 500);
  };

  // ── Finish scan ───────────────────────────────────────────────
  const finishScan = async (heartRate, scanData) => {
    stopCamera();
    try {
      const res = await addHealthData({ userId: user?.id, heartRate });
      setResult({ heartRate, hrv: scanData?.hrv || null, stressScore: scanData?.stress_score || null, data: res.data });
    } catch (_) {
      setResult({ heartRate, hrv: scanData?.hrv || null, stressScore: scanData?.stress_score || null, data: null });
    }
    setPhase('done');
    showToast(`✅ Scan complete! Heart Rate: ${heartRate} BPM`);
  };

  // ── Cancel ────────────────────────────────────────────────────
  const cancelScan = () => {
    doneRef.current = true;
    clearInterval(pollRef.current);
    clearInterval(frameRef.current);
    clearInterval(timerRef.current);
    stopCamera();
    setPhase('idle');
    setProgress(0);
    setCountdown(SCAN_DURATION);
    showToast('Scan cancelled.', 'error');
  };

  useEffect(() => () => {
    clearInterval(pollRef.current);
    clearInterval(frameRef.current);
    clearInterval(timerRef.current);
    stopCamera();
  }, [stopCamera]);

  // ── Derived values ────────────────────────────────────────────
  const isNormal   = result?.heartRate >= 60 && result?.heartRate <= 100;
  const RADIUS     = 36;
  const CIRC       = 2 * Math.PI * RADIUS;
  const offset     = CIRC - (CIRC * progress / 100);
  const phaseLabel =
    progress < 25 ? 'Warming up...'       :
    progress < 60 ? 'Analyzing signal...' :
    progress < 90 ? 'Almost done...'      : 'Finishing!';

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />

      {/* Hidden canvas used to capture video frames */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-syne text-2xl font-bold mb-1">Heart Rate Scanner</h1>
          <p className="text-slate-400 text-sm mb-6">
            Real MediaPipe rPPG • Live camera feed • Saved to MongoDB
          </p>

          <div className="grid grid-cols-2 gap-6">

            {/* ── LEFT PANEL ── */}
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-syne font-semibold">📷 Scanner</h3>
                {phase === 'scanning' && (
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 text-xs font-medium">LIVE</span>
                  </div>
                )}
              </div>

              {/* IDLE */}
              {phase === 'idle' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={startScan}
                  className="border-2 border-dashed border-[rgba(99,179,237,0.2)] rounded-2xl p-10 text-center cursor-pointer hover:border-[#00d4aa] hover:bg-[#00d4aa]/5 transition-all group"
                >
                  <div className="relative w-24 h-24 mx-auto mb-5">
                    <div className="absolute inset-0 rounded-full bg-[#00d4aa]/10 animate-ping" />
                    <div className="absolute inset-2 rounded-full bg-[#00d4aa]/10 animate-ping"
                      style={{ animationDelay: '0.5s' }} />
                    <div className="relative w-24 h-24 rounded-full bg-[#00d4aa]/15 flex items-center justify-center text-4xl">
                      💓
                    </div>
                  </div>
                  <div className="font-syne font-bold text-xl mb-2">Start Face Scan</div>
                  <div className="text-sm text-slate-400 mb-6 leading-relaxed">
                    Your live camera appears here in the browser.<br />
                    <span className="text-[#00d4aa]">Keep your face centred for 30 seconds.</span><br />
                    Ensure good lighting on your face!
                  </div>
                  {camError && (
                    <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                      ⚠️ {camError}
                    </div>
                  )}
                  <div
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-syne font-bold text-[#080c14] text-sm group-hover:scale-105 transition-all"
                    style={{ background: 'linear-gradient(135deg, #00d4aa, #00b890)' }}
                  >
                    ▶ Begin Real Scan
                  </div>
                </motion.div>
              )}

              {/* SCANNING */}
              {phase === 'scanning' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div
                    className="relative rounded-2xl overflow-hidden border border-[rgba(99,179,237,0.15)]"
                    style={{ height: '240px', background: '#000' }}
                  >
                    <video
                      key="scan-video"
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)',
                        display: 'block',
                        backgroundColor: '#000',
                      }}
                    />

                    {/* Face guide box */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div style={{
                        width: 160, height: 200,
                        border: `2px ${faceDetected ? 'solid' : 'dashed'} ${faceDetected ? '#00d4aa' : '#f59e0b'}`,
                        borderRadius: 16,
                        boxShadow: faceDetected ? '0 0 20px rgba(0,212,170,0.3)' : 'none',
                        transition: 'border-color 0.4s, box-shadow 0.4s',
                      }} />
                    </div>

                    {/* Top bar */}
                    <div
                      className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2"
                      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)' }}
                    >
                      <div className={`flex items-center gap-1.5 text-xs font-semibold ${faceDetected ? 'text-[#00d4aa]' : 'text-yellow-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${faceDetected ? 'bg-[#00d4aa] animate-pulse' : 'bg-yellow-400'}`} />
                        {faceDetected ? '✓ Face locked' : 'Searching for face...'}
                      </div>
                      <span className="text-xs text-white/60 bg-black/40 px-2 py-0.5 rounded-full">
                        {framesCapture} frames
                      </span>
                    </div>

                    {/* Progress strip */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <div style={{
                        height: '100%', width: `${progress}%`,
                        background: 'linear-gradient(90deg, #00d4aa, #0ea5e9)',
                        transition: 'width 0.4s linear',
                      }} />
                    </div>
                  </div>

                  {/* Ring + bar */}
                  <div className="flex items-center gap-4 mt-4 mb-3">
                    <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
                      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="rgba(0,212,170,0.1)" strokeWidth="8" />
                        <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="#00d4aa" strokeWidth="8"
                          strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.2s linear' }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-syne font-bold text-xl text-[#00d4aa] leading-none">{countdown}</span>
                        <span className="text-slate-500 text-xs">sec</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-syne font-semibold text-sm mb-1">{phaseLabel}</div>
                      <div className="text-xs text-slate-400 mb-2">{progress}% complete</div>
                      <div className="h-2 bg-[#111827] rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#00d4aa,#0ea5e9)', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  </div>

                  <div className={`px-4 py-3 rounded-xl text-sm mb-3 ${
                    faceDetected
                      ? 'bg-[#00d4aa]/5 border border-[#00d4aa]/20 text-[#00d4aa]'
                      : 'bg-yellow-500/5 border border-yellow-500/20 text-yellow-400'
                  }`}>
                    {faceDetected ? '✅ Face locked! Stay still and breathe normally.' : '⚠️ Move your face into the centre of the dotted box.'}
                  </div>

                  <button onClick={cancelScan}
                    className="w-full py-2.5 rounded-xl text-sm text-slate-400 border border-[rgba(99,179,237,0.12)] hover:border-red-500/30 hover:text-red-400 transition-all">
                    ✕ Cancel Scan
                  </button>
                </motion.div>
              )}

              {/* DONE */}
              {phase === 'done' && result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className={`w-36 h-36 rounded-full mx-auto mb-4 flex flex-col items-center justify-center border-4 ${
                      isNormal ? 'border-[#00d4aa] bg-[#00d4aa]/10' : 'border-red-400 bg-red-400/10'
                    }`}
                  >
                    <div className={`font-syne text-4xl font-bold ${isNormal ? 'text-[#00d4aa]' : 'text-red-400'}`}>
                      {result.heartRate}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">BPM</div>
                  </motion.div>

                  <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ${
                    isNormal
                      ? 'bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/30'
                      : 'bg-red-400/10 text-red-400 border border-red-400/30'
                  }`}>
                    {isNormal ? '✅ Normal Range (60–100 bpm)' : '⚠️ Outside Normal Range'}
                  </div>

                  {(result.hrv || result.stressScore != null) && (
                    <div className="flex gap-3 justify-center mb-4">
                      {result.hrv && (
                        <div className="px-4 py-2 bg-[#090e19]/90 rounded-xl border border-[rgba(99,179,237,0.08)] text-center">
                          <div className="text-xs text-slate-500">HRV</div>
                          <div className="font-syne font-bold text-[#0ea5e9]">{result.hrv} ms</div>
                        </div>
                      )}
                      {result.stressScore != null && (
                        <div className="px-4 py-2 bg-[#090e19]/90 rounded-xl border border-[rgba(99,179,237,0.08)] text-center">
                          <div className="text-xs text-slate-500">Stress Score</div>
                          <div className="font-syne font-bold text-[#f59e0b]">{result.stressScore}/100</div>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mb-5">
                    Detected via MediaPipe rPPG • {result.data ? 'Saved to MongoDB ✅' : 'DB save skipped'}
                  </p>

                  <button
                    onClick={() => { setPhase('idle'); setResult(null); }}
                    className="w-full py-3 rounded-xl text-sm font-syne font-semibold border border-[rgba(99,179,237,0.12)] text-slate-300 hover:border-[#00d4aa]/40 hover:text-[#00d4aa] transition-all"
                  >
                    🔄 Scan Again
                  </button>
                </motion.div>
              )}
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="space-y-4">
              <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
                <h3 className="font-syne font-semibold mb-4">📊 Scan Details</h3>

                {phase === 'idle' && (
                  <div className="text-center py-8 text-slate-500">
                    <div className="text-3xl mb-2">💤</div>
                    <div className="text-sm">No scan yet.<br />Click Begin Real Scan to start.</div>
                  </div>
                )}

                {phase === 'scanning' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Progress',  value: progress + '%',  color: '#00d4aa' },
                        { label: 'Time Left', value: countdown + 's', color: '#0ea5e9' },
                        { label: 'Frames',    value: framesCapture,   color: '#f59e0b' },
                        { label: 'Face', value: faceDetected ? '✅ Locked' : '⏳ Searching',
                          color: faceDetected ? '#00d4aa' : '#f59e0b' },
                      ].map((s, i) => (
                        <div key={i} className="bg-[#090e19]/90 rounded-xl p-3 text-center border border-[rgba(99,179,237,0.08)]">
                          <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                          <div className="font-syne font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 py-2 rounded-xl text-xs bg-[#111827] border border-[rgba(99,179,237,0.08)] text-slate-400 text-center">
                      🔬 Browser sending frames → Python MediaPipe analyzing...
                    </div>
                  </div>
                )}

                {phase === 'done' && result && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Heart Rate', value: result.heartRate + ' bpm', color: isNormal ? '#00d4aa' : '#ef4444' },
                        { label: 'Status',     value: isNormal ? 'Normal' : 'High', color: isNormal ? '#00d4aa' : '#ef4444' },
                        { label: 'Method',     value: 'rPPG',  color: '#0ea5e9' },
                        { label: 'Saved', value: result.data ? '✅ DB' : '⚠️ No DB', color: result.data ? '#00d4aa' : '#f59e0b' },
                      ].map((item, i) => (
                        <div key={i} className="bg-[#090e19]/90 rounded-xl p-3 text-center border border-[rgba(99,179,237,0.08)]">
                          <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                          <div className="font-syne font-bold text-sm" style={{ color: item.color }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {result.data?.aiAdvice?.summary && (
                      <div className="px-3 py-2.5 rounded-xl text-xs bg-[#00d4aa]/5 border border-[#00d4aa]/20 text-slate-300 leading-relaxed">
                        🤖 {result.data.aiAdvice.summary}
                      </div>
                    )}
                    {result.data?.aiAdvice && (
                      <div className="space-y-1.5">
                        {[
                          { label: '🍳 Breakfast', value: result.data.aiAdvice.breakfast },
                          { label: '🥗 Lunch',     value: result.data.aiAdvice.lunch },
                          { label: '🍽️ Dinner',   value: result.data.aiAdvice.dinner },
                        ].filter(m => m.value).map((m, i) => (
                          <div key={i} className="bg-[#090e19]/90 rounded-xl px-3 py-2 border border-[rgba(99,179,237,0.06)]">
                            <span className="text-xs text-slate-500">{m.label}: </span>
                            <span className="text-xs text-slate-300">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.data?.recommendation?.alerts?.map((a, i) => (
                      <div key={i} className="px-3 py-2 rounded-xl text-xs bg-yellow-500/5 border border-yellow-500/20 text-yellow-300">{a}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-5">
                <h3 className="font-syne font-semibold mb-3">ℹ️ How rPPG Works</h3>
                <div className="space-y-3">
                  {[
                    { icon: '📷', title: 'Camera in Browser',    desc: 'Webcam activates right here in the app' },
                    { icon: '🔬', title: 'Face Detection',       desc: 'MediaPipe finds & locks on your face' },
                    { icon: '🧮', title: 'rPPG Signal Analysis', desc: 'Skin colour changes reveal your pulse' },
                    { icon: '💾', title: 'Saved + AI Diet',      desc: 'BPM saved to MongoDB + AI diet plan' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#111827] flex items-center justify-center text-sm flex-shrink-0 border border-[rgba(99,179,237,0.06)]">
                        {s.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{s.title}</div>
                        <div className="text-xs text-slate-400">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
      <Toast {...toast} onClose={() => setToast(p => ({ ...p, show: false }))} />
    </div>
  );
}

