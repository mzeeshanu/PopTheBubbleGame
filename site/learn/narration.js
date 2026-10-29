(function (root) {
  "use strict";
  const profiles = {
    prompt: { rate: 0.94, pitch: 1.08 },
    cheer: { rate: 1.02, pitch: 1.16 },
    count: { rate: 0.86, pitch: 1.05 },
    hint: { rate: 0.88, pitch: 1.04 },
    animal: { rate: 0.91, pitch: 1.14 },
  };
  const cheers = [
    "Hooray! You found it!",
    "Wonderful! You did it!",
    "Wow! Great exploring!",
    "Yay! What a discovery!",
    "You got it! High five!",
  ];
  const welcomes = {
    numbers: "Our animal friends are ready! Let’s count together.",
    letters: "Hello, little letter explorer! Let’s play with the ABCs.",
    colors: "A rainbow adventure! Let’s find some colors.",
    animals: "Our animal friends want to say hello! Who can you find?",
    shapes: "Circles, stars, and more! Let’s go on a shape hunt.",
    objects: "Time for a treasure hunt! What can you spot?",
  };
  function chooseVoice(voices, preferred) {
    const english = voices.filter((v) => /^en(?:[-_]|$)/i.test(v.lang));
    const saved = english.find((v) => v.voiceURI === preferred);
    if (saved) return saved;
    return english
      .map((voice, index) => ({
        voice,
        index,
        score:
          (/natural|premium|enhanced|neural/i.test(voice.name) ? 8 : 0) +
          (/Google|Samantha|Aria|Jenny|Ava|Zira/i.test(voice.name) ? 4 : 0) +
          (/^en-US$/i.test(voice.lang) ? 2 : 0) +
          (voice.default ? 1 : 0),
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.voice;
  }
  function createNarrator({ synth, Utterance, onError = () => {} }) {
    let enabled = true,
      preferred = "",
      style = "playful";
    function stop() {
      if (synth) synth.cancel();
    }
    function configure(options) {
      if (options.enabled !== undefined) enabled = options.enabled;
      if (options.preferred !== undefined) preferred = options.preferred;
      if (options.style !== undefined) style = options.style;
      stop();
    }
    function say(text, kind = "prompt") {
      stop();
      if (!enabled || !synth || !Utterance) return;
      const segments = Array.isArray(text) ? text : [{ text, kind }];
      const voice = chooseVoice(synth.getVoices(), preferred);
      for (const segment of segments) {
        const utterance = new Utterance(segment.text);
        const profile = profiles[segment.kind || kind] || profiles.prompt;
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang || "en-US";
        utterance.rate = style === "gentle" ? 0.85 : profile.rate;
        utterance.pitch = style === "gentle" ? 1 : profile.pitch;
        utterance.volume = 0.85;
        utterance.onerror = (event) => {
          if (!["interrupted", "canceled"].includes(event.error)) onError();
        };
        synth.speak(utterance);
      }
    }
    return { say, stop, configure };
  }
  root.SofiNarration = {
    profiles,
    cheers,
    welcomes,
    chooseVoice,
    createNarrator,
  };
  if (typeof module !== "undefined") module.exports = root.SofiNarration;
})(typeof window === "undefined" ? globalThis : window);
