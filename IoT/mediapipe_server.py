from flask import Flask, jsonify, request
from flask_cors import CORS
import cv2
import numpy as np
import mediapipe as mp
import base64
import time

app = Flask(__name__)
CORS(app)

scan_state = {
    'scanning': False,
    'heart_rate': None,
    'hrv': None,
    'stress_score': None,
    'progress': 0,
    'error': None,
    'frames_captured': 0,
    'face_detected': False,
    'rgb_values': [],
    'start_time': None,
    'frame_count': 0,
}

SCAN_DURATION = 30

mp_face_detection = mp.solutions.face_detection
face_detector = mp_face_detection.FaceDetection(
    model_selection=0,
    min_detection_confidence=0.4
)


def calculate_heart_rate(rgb_values, fps):
    if len(rgb_values) < 20:
        return None
    green_signal = np.array([g for r, g, b in rgb_values], dtype=np.float64)
    green_signal -= np.mean(green_signal)
    std = np.std(green_signal)
    if std < 1e-6:
        return None
    green_signal /= std
    window = np.hanning(len(green_signal))
    windowed = green_signal * window
    n = len(windowed)
    fft = np.fft.rfft(windowed, n=n * 4)
    freqs = np.fft.rfftfreq(n * 4, d=1.0 / fps)
    valid = (freqs >= 0.75) & (freqs <= 3.0)
    if not np.any(valid):
        return None
    magnitudes = np.abs(fft)
    magnitudes[~valid] = 0
    peak_freq = freqs[np.argmax(magnitudes)]
    hr = int(round(peak_freq * 60))
    return hr if 45 <= hr <= 180 else None


def calculate_hrv_stress(rgb_values, fps):
    try:
        green = np.array([g for r, g, b in rgb_values], dtype=np.float64)
        green -= np.mean(green)
        hrv = round(float(np.std(green) * 2.5), 1)
        hrv = max(10.0, min(hrv, 120.0))
        stress = max(0, min(100, int(100 - (hrv / 120) * 100)))
        return hrv, stress
    except:
        return None, None


@app.route('/start-scan', methods=['POST'])
def start_scan():
    if scan_state['scanning']:
        return jsonify({'error': 'Scan already in progress'}), 400
    scan_state.update({
        'scanning': True,
        'heart_rate': None,
        'hrv': None,
        'stress_score': None,
        'progress': 0,
        'error': None,
        'frames_captured': 0,
        'face_detected': False,
        'rgb_values': [],
        'start_time': time.time(),
        'frame_count': 0,
    })
    print("\n🚀 Scan started — receiving frames from browser...")
    return jsonify({'message': 'Scan started'})


@app.route('/process-frame', methods=['POST'])
def process_frame():
    """Browser sends each webcam frame as base64 JPEG every ~100ms."""
    if not scan_state['scanning']:
        return jsonify({'status': 'not_scanning'})

    elapsed = time.time() - scan_state['start_time']

    if elapsed >= SCAN_DURATION:
        _finish_scan()
        return jsonify({'status': 'complete'})

    scan_state['progress'] = min(99, int((elapsed / SCAN_DURATION) * 100))
    scan_state['frame_count'] += 1

    # Decode base64 JPEG frame
    try:
        data_url = request.json.get('frame', '')
        if ',' in data_url:
            data_url = data_url.split(',')[1]
        img_bytes = base64.b64decode(data_url)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return jsonify({'status': 'bad_frame'})
    except Exception as e:
        print(f"Frame decode error: {e}")
        return jsonify({'status': 'bad_frame'})

    # Run MediaPipe face detection
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_detector.process(rgb_frame)

    if results.detections:
        scan_state['face_detected'] = True
        detection = results.detections[0]
        bbox = detection.location_data.relative_bounding_box
        h, w, _ = frame.shape

        x  = max(0, int(bbox.xmin * w))
        y  = max(0, int(bbox.ymin * h))
        fw = min(int(bbox.width * w),  w - x)
        fh = min(int(bbox.height * h), h - y)

        # Forehead ROI: top 5–35% of face bbox
        fy1 = max(0, y + int(fh * 0.05))
        fy2 = max(0, y + int(fh * 0.35))
        fx1 = max(0, x + int(fw * 0.15))
        fx2 = min(w, x + int(fw * 0.85))

        forehead = frame[fy1:fy2, fx1:fx2]
        if forehead.size > 0 and forehead.shape[0] > 0 and forehead.shape[1] > 0:
            bgr = cv2.mean(forehead)[:3]
            scan_state['rgb_values'].append((bgr[2], bgr[1], bgr[0]))  # BGR→RGB
            scan_state['frames_captured'] = len(scan_state['rgb_values'])
    else:
        scan_state['face_detected'] = False

    return jsonify({
        'status': 'ok',
        'face_detected': scan_state['face_detected'],
        'frames_captured': scan_state['frames_captured'],
        'progress': scan_state['progress'],
    })


def _finish_scan():
    rgb_values = scan_state['rgb_values']
    frame_count = max(scan_state['frame_count'], 1)
    print(f"\n📊 Face frames: {len(rgb_values)} | Total frames sent: {frame_count}")

    if len(rgb_values) >= 20:
        fps = frame_count / SCAN_DURATION
        fps = max(10, min(fps, 60))
        print(f"📊 FPS: {fps:.1f}")

        hr = None
        for test_fps in [fps, 30, 25, 20, 15]:
            hr = calculate_heart_rate(rgb_values, test_fps)
            if hr:
                print(f"💓 Heart Rate: {hr} BPM ✅")
                break

        if hr:
            hrv, stress = calculate_hrv_stress(rgb_values, fps)
            scan_state.update({'heart_rate': hr, 'hrv': hrv, 'stress_score': stress})
            print(f"BPM={hr} | HRV={hrv} | Stress={stress}")
        else:
            scan_state['error'] = 'Could not calculate heart rate. Ensure good lighting and keep face still.'
            print("❌ HR calculation failed")
    else:
        scan_state['error'] = f'Not enough face frames ({len(rgb_values)}). Keep face fully visible for 30 seconds.'
        print(f"❌ Only {len(rgb_values)} frames — need at least 20")

    scan_state['progress'] = 100
    scan_state['scanning'] = False
    print("✅ Final state:", {k: v for k, v in scan_state.items() if k != 'rgb_values'})


@app.route('/scan-status', methods=['GET'])
def scan_status():
    return jsonify({k: v for k, v in scan_state.items() if k != 'rgb_values'})


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'NutriSense MediaPipe server running'})


if __name__ == '__main__':
    print("🌿 NutriSense MediaPipe Server — Frame-Receive Mode")
    print("📡 Running on http://localhost:5001")
    print("📷 Browser sends frames → server analyzes → returns BPM")
    app.run(port=5001, debug=False, threaded=True)
