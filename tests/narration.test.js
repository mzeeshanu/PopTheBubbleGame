const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  chooseVoice,
  createNarrator,
  welcomes,
  cheers,
} = require("../site/learn/narration");
const voices = [
  { name: "Français Natural", lang: "fr-FR", voiceURI: "fr" },
  { name: "English Basic", lang: "en-US", voiceURI: "basic", default: true },
  { name: "English Natural", lang: "en-US", voiceURI: "natural" },
];
test("voice selection respects saved choice, then prefers a natural English voice", () => {
  assert.equal(chooseVoice(voices, "basic").voiceURI, "basic");
  assert.equal(chooseVoice(voices, "missing").voiceURI, "natural");
  assert.equal(chooseVoice([]), undefined);
  assert.equal(chooseVoice([voices[0]]), undefined);
});
function fixture() {
  const queue = [];
  let cancels = 0;
  const synth = {
    getVoices: () => voices,
    cancel: () => {
      queue.length = 0;
      cancels++;
    },
    speak: (utterance) => queue.push(utterance),
  };
  class Utterance {
    constructor(text) {
      this.text = text;
    }
  }
  return {
    queue,
    synth,
    Utterance,
    get cancels() {
      return cancels;
    },
  };
}
test("expressive segments stay in order and a new prompt replaces old speech", () => {
  const f = fixture(),
    narrator = createNarrator(f);
  narrator.say([
    { text: "One!", kind: "count" },
    { text: "Hooray!", kind: "cheer" },
  ]);
  assert.deepEqual(
    f.queue.map((u) => u.text),
    ["One!", "Hooray!"],
  );
  assert.ok(f.queue[0].rate < f.queue[1].rate);
  assert.equal(f.queue[0].voice.voiceURI, "natural");
  narrator.say("Find red");
  assert.deepEqual(
    f.queue.map((u) => u.text),
    ["Find red"],
  );
});
test("muting cancels queued speech and prevents new narration", () => {
  const f = fixture(),
    narrator = createNarrator(f);
  narrator.say("Hello!");
  narrator.configure({ enabled: false });
  narrator.say("Hooray!");
  assert.equal(f.queue.length, 0);
  narrator.configure({ enabled: true, style: "gentle", preferred: "basic" });
  narrator.say("Hello!", "cheer");
  assert.equal(f.queue[0].rate, 0.85);
  assert.equal(f.queue[0].pitch, 1);
  assert.equal(f.queue[0].voice.voiceURI, "basic");
  narrator.stop();
  assert.equal(f.queue.length, 0);
});
test("speech without loaded voices falls back to browser default; unsupported speech is safe", () => {
  const f = fixture();
  f.synth.getVoices = () => [];
  const narrator = createNarrator(f);
  narrator.say("Hello!");
  assert.equal(f.queue[0].lang, "en-US");
  assert.doesNotThrow(() =>
    createNarrator({ synth: null, Utterance: null }).say("Hello!"),
  );
});
test("every world has a welcome and celebrations offer variety", () => {
  const { worlds } = require("../site/learn/content");
  assert.deepEqual(Object.keys(welcomes), Object.keys(worlds));
  assert.equal(new Set(cheers).size, 5);
});
