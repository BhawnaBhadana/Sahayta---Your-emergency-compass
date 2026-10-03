import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EMERGENCY_TYPES, SEVERITY_LEVELS } from '../utils/constants';
import * as sosService from '../services/sosService';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { extractEmergencyInfo } from '../utils/extractEmergencyInfo';
import { useOfflineSosQueue } from '../hooks/useOfflineSosQueue';
import { useRealtime } from '../context/RealtimeContext';
import { useToast } from '../context/ToastContext';

const ACTIVATION_MS = 2500;
const CONFIRM_COUNTDOWN_S = 3;

export default function SosActivation() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { isOnline } = useRealtime();
  const { queueOffline } = useOfflineSosQueue();

  const [step, setStep] = useState('hold'); // hold -> details -> confirming -> submitting -> done -> offline
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Detecting location...');
  const [emergencyType, setEmergencyType] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [affectedCount, setAffectedCount] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(CONFIRM_COUNTDOWN_S);
  const [voiceExtraction, setVoiceExtraction] = useState(null);
  const holdTimer = useRef(null);
  const holdStart = useRef(null);
  const countdownTimer = useRef(null);

  const voice = useVoiceInput(i18n.language);

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Location unavailable — using approximate default');
      setLocation({ lat: 28.6139, lng: 77.209 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('Location captured');
      },
      () => {
        setLocationStatus('Permission denied — using approximate default');
        setLocation({ lat: 28.6139, lng: 77.209 });
      },
      { timeout: 8000 }
    );
  }

  function startHold() {
    if (holdTimer.current) return;
    detectLocation();
    holdStart.current = Date.now();
    holdTimer.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - holdStart.current) / ACTIVATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(holdTimer.current);
        holdTimer.current = null;
        setStep('details');
      }
    }, 40);
  }

  function cancelHold() {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    setProgress(0);
  }

  function handleVoiceStart() {
    voice.start(
      (text) => {
        const extracted = extractEmergencyInfo(text);
        setVoiceExtraction(extracted);
      },
      () => toast.error(t('sos.voiceNotSupported'))
    );
  }

  function acceptVoiceExtraction() {
    if (!voiceExtraction) return;
    setEmergencyType(voiceExtraction.emergency_type);
    setSeverity(voiceExtraction.severity);
    setDescription(voiceExtraction.description);
    if (voiceExtraction.affected_count != null) setAffectedCount(String(voiceExtraction.affected_count));
    setVoiceExtraction(null);
  }

  function openConfirm() {
    setError('');
    if (!emergencyType || !severity) {
      setError('Please select an emergency type and severity.');
      return;
    }
    setCountdown(CONFIRM_COUNTDOWN_S);
    setStep('confirming');
  }

  function beginCountdown() {
    setCountdown(CONFIRM_COUNTDOWN_S);
    countdownTimer.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownTimer.current);
          handleSubmit();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  function cancelConfirm() {
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setStep('details');
  }

  async function handleSubmit() {
    setStep('submitting');
    const payload = {
      emergency_type: emergencyType,
      severity,
      description: affectedCount ? `${description} (${affectedCount} people affected)`.trim() : description,
      latitude: location?.lat ?? 28.6139,
      longitude: location?.lng ?? 77.209,
    };

    if (!isOnline) {
      queueOffline(payload);
      setStep('offline');
      return;
    }

    try {
      const data = await sosService.createSos(payload);
      setResult(data);
      setStep('done');
    } catch (err) {
      // Network genuinely failed (not just "offline" flag) — fall back to the same offline-safe path.
      queueOffline(payload);
      setStep('offline');
    }
  }

  if (step === 'offline') {
    return (
      <div className="mx-auto max-w-lg py-8 text-center">
        <div className="card border-2 border-yellow-300">
          <p className="text-5xl">📡</p>
          <h1 className="mt-3 text-xl font-bold text-text-primary">{t('sos.savedOffline')}</h1>
          <p className="mt-2 text-sm text-text-secondary">{t('sos.willRetry')}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-outline mt-6 w-full">{t('common.back')}</button>
        </div>
      </div>
    );
  }

  if (step === 'done' && result) {
    return (
      <div className="mx-auto max-w-lg py-8 text-center">
        <div className="card border-2 border-secondary-200 text-left">
          <div className="text-center">
            <p className="text-5xl">✅</p>
            <h1 className="mt-3 text-2xl font-bold text-text-primary">{t('sos.sentTitle')}</h1>
            <p className="mt-1 font-mono text-lg text-primary-700">{result.sos.code}</p>
          </div>
          <div className="mt-4 space-y-1 text-sm text-text-secondary">
            <p>✓ {t('sos.locationShared')}</p>
            <p>✓ {t('sos.emergencyReceived')}</p>
            <p>✓ {t('sos.autoTriaged', { severity: result.sos.severity, type: result.sos.emergency_type })}</p>
          </div>

          {result.triage && (
            <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{t('sos.aiTriageTitle')}</p>
              <p className="mt-1 text-sm text-text-secondary">{result.triage.reasoning}</p>
              <ul className="mt-2 text-sm text-text-secondary">
                {result.triage.recommended_response?.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
              <p className="mt-2 text-xs italic text-text-tertiary">{t('sos.aiTriageDisclaimer')}</p>
            </div>
          )}

          {result.recommended_responders?.length > 0 && (
            <p className="mt-3 text-sm text-text-secondary">{result.recommended_responders.length} responders identified nearby.</p>
          )}
          {result.recommended_hospital && (
            <p className="text-sm text-text-secondary">Nearest hospital: {result.recommended_hospital.name}</p>
          )}
          <button onClick={() => navigate(`/sos/${result.sos.id}`)} className="btn-primary mt-6 w-full">{t('sos.trackThis')}</button>
        </div>
      </div>
    );
  }

  if (step === 'confirming') {
    if (!countdownTimer.current) beginCountdown();
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="card">
          <p className="text-4xl">🚨</p>
          <h1 className="mt-3 text-xl font-bold text-text-primary">{t('sos.immediateDanger')}</h1>
          <p className="mt-2 text-sm text-text-secondary">{t('sos.confirmBody')}</p>
          <p className="mt-4 text-3xl font-black text-accent-600">{countdown}</p>
          <button onClick={cancelConfirm} className="btn-outline mt-4 w-full">{t('sos.countdownCancel', { seconds: countdown })}</button>
        </div>
      </div>
    );
  }

  if (step === 'details' || step === 'submitting') {
    return (
      <div className="mx-auto max-w-lg py-8">
        <div className="card">
          <h1 className="text-xl font-bold text-text-primary">{t('sos.detailsTitle')}</h1>
          <p className="mt-1 text-sm text-text-secondary">{locationStatus}{location && ` (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`}</p>

          {error && <p role="alert" className="mt-3 rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-sm text-accent-700">{error}</p>}

          <button
            type="button"
            onClick={voice.listening ? voice.stop : handleVoiceStart}
            className={`mt-4 w-full rounded-lg border-2 py-2 text-sm font-semibold ${voice.listening ? 'border-accent-600 bg-accent-50 text-accent-700 animate-pulse' : 'border-primary-200 text-primary-700 hover:bg-primary-50'}`}
          >
            {voice.listening ? t('sos.listening') : t('sos.speakInstead')}
          </button>

          {voiceExtraction && (
            <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm">
              <p className="font-semibold text-text-primary">{t('sos.confirmExtracted')}</p>
              <p className="mt-1 text-text-secondary">"{voiceExtraction.description}"</p>
              <p className="mt-1 text-text-secondary">
                {t('sos.emergencyType')}: <strong>{voiceExtraction.emergency_type}</strong> · {t('sos.severity')}: <strong>{voiceExtraction.severity}</strong>
                {voiceExtraction.affected_count != null && <> · {voiceExtraction.affected_count} people</>}
              </p>
              <div className="mt-2 flex gap-2">
                <button onClick={acceptVoiceExtraction} className="btn-secondary !px-3 !py-1.5 text-sm">{t('common.confirm')}</button>
                <button onClick={() => setVoiceExtraction(null)} className="btn-outline !px-3 !py-1.5 text-sm">{t('common.cancel')}</button>
              </div>
            </div>
          )}

          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold text-text-primary">{t('sos.emergencyType')}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {EMERGENCY_TYPES.map((et) => (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => setEmergencyType(et.value)}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${emergencyType === et.value ? 'border-accent-600 bg-accent-50 text-accent-700' : 'border-surface-100 text-text-secondary hover:border-accent-200'}`}
                >
                  <span className="mr-1">{et.icon}</span>{t(et.labelKey)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold text-text-primary">{t('sos.severity')}</legend>
            <div className="grid grid-cols-4 gap-2">
              {SEVERITY_LEVELS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`rounded-lg border-2 py-2 text-sm font-semibold transition-colors ${severity === s.value ? 'border-accent-600 text-accent-700' : 'border-surface-100 text-text-secondary hover:border-accent-200'}`}
                >
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-4">
            <label htmlFor="desc" className="mb-1 block text-sm font-semibold text-text-primary">{t('sos.description')}</label>
            <textarea id="desc" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} className="input-field h-24 resize-none" placeholder={t('sos.descriptionPlaceholder')} />
          </div>

          <div className="mt-4">
            <label htmlFor="affected" className="mb-1 block text-sm font-semibold text-text-primary">{t('sos.peopleAffected')}</label>
            <input id="affected" type="number" min={0} value={affectedCount} onChange={(e) => setAffectedCount(e.target.value)} className="input-field" />
          </div>

          <button onClick={openConfirm} disabled={step === 'submitting'} className="btn-emergency mt-6 w-full">
            {step === 'submitting' ? t('sos.sending') : t('sos.send')}
          </button>
          <button onClick={() => setStep('hold')} className="mt-2 w-full text-sm text-text-secondary hover:underline">{t('common.cancel')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h1 className="text-2xl font-bold text-text-primary">{t('sos.title')}</h1>
      <p className="mt-2 text-text-secondary">{t('sos.holdInstruction', { seconds: ACTIVATION_MS / 1000 })}</p>

      <div className="relative mx-auto mt-8 h-64 w-64">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" stroke="#FEE2E2" strokeWidth="6" fill="none" />
          <circle
            cx="50" cy="50" r="46" stroke="#DC2626" strokeWidth="6" fill="none"
            strokeDasharray={289} strokeDashoffset={289 - (progress / 100) * 289}
            style={{ transition: 'stroke-dashoffset 40ms linear' }}
          />
        </svg>
        <button
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          aria-label="Hold to activate SOS emergency alert"
          className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-accent-600 text-white shadow-emergency hover:bg-accent-700 focus:outline-none focus:ring-4 focus:ring-accent-300 animate-pulse-emergency"
        >
          <span className="text-3xl font-black">SOS</span>
          <span className="mt-1 text-sm">EMERGENCY</span>
        </button>
      </div>
      <p className="mt-4 text-sm text-text-tertiary">{t('sos.releaseNote')}</p>
    </div>
  );
}
