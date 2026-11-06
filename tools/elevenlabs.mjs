// Turns a brief's voice block into an ElevenLabs request. Pure, so it can be unit tested.
// The rules writers follow are in docs/BRIEF_FORMAT.md, "Intonation and language".

export const DEFAULT_MODEL = 'eleven_v4';

// ElevenLabs' recommended starting points for each kind of delivery.
export const DELIVERY = {
  narration: { stability: 0.7, similarityBoost: 0.5 },
  conversational: { stability: 0.4, similarityBoost: 0.75 },
  news: { stability: 0.8, similarityBoost: 0.6 },
  drama: { stability: 0.3, similarityBoost: 0.8 },
};

const TAG = /\[[^\]\n]+\]/g;
export const hasAudioTags = (text) => (text.match(TAG) || []).length > 0;
export const withoutAudioTags = (text) => text.replace(TAG, ' ');
export const modelFollowsTags = (model) => /^eleven_v[34](_|$)/.test(model);

export function voiceSettings(voice = {}) {
  const settings = { ...DELIVERY[voice.delivery] };
  if (voice.stability !== undefined) settings.stability = voice.stability;
  if (voice.similarity_boost !== undefined) settings.similarityBoost = voice.similarity_boost;
  return Object.keys(settings).length ? settings : undefined;
}

export function speechRequest(text, voice, language = 'en', model = DEFAULT_MODEL) {
  const request = { text, modelId: model, outputFormat: 'mp3_44100_128' };
  const settings = voiceSettings(voice);
  if (settings) request.voiceSettings = settings;
  // ElevenLabs documents language_code as unsupported on this one model.
  if (model !== 'eleven_multilingual_v2') request.languageCode = language;
  return request;
}
