/* No account, tracking, remote audio, or dependency required. */
(() => {
  "use strict";
  const { worlds, question } = window.SofiContent;
  const game = document.querySelector("#game");
  const sound = document.querySelector("#sound");
  let enabled = true,
    context,
    worldKey,
    round = 0,
    current,
    answered = false,
    counted = new Set();
  try {
    enabled = localStorage.getItem("sofi-sound") !== "off";
  } catch {}
  const hasSpeech =
    "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  function stop() {
    if (hasSpeech) window.speechSynthesis.cancel();
  }
  function say(text) {
    stop();
    if (!enabled || !hasSpeech) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    utterance.pitch = 1.12;
    utterance.onerror = (event) => {
      if (!["interrupted", "canceled"].includes(event.error))
        document.querySelector("#audio-note").textContent =
          "Voice is unavailable right now. You can still play using the pictures and words.";
    };
    window.speechSynthesis.speak(utterance);
  }
  function chime() {
    if (!enabled) return;
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      context.resume().catch(() => {});
      [523.25, 659.25, 783.99].forEach((frequency, i) => {
        const oscillator = context.createOscillator(),
          gain = context.createGain(),
          time = context.currentTime + i * 0.12;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.045, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(time);
        oscillator.stop(time + 0.32);
      });
    } catch {
      /* Visual rewards remain available without Web Audio. */
    }
  }
  function soundLabel() {
    sound.textContent = enabled ? "🔊 Sound on" : "🔇 Sound off";
    sound.setAttribute("aria-pressed", String(enabled));
  }
  soundLabel();
  sound.onclick = () => {
    enabled = !enabled;
    soundLabel();
    stop();
    if (!enabled && context) context.suspend().catch(() => {});
    try {
      localStorage.setItem("sofi-sound", enabled ? "on" : "off");
    } catch {}
    if (enabled) say(current ? current.prompt : "Sound is on. Let’s play!");
  };
  if (!hasSpeech)
    document.querySelector("#audio-note").textContent =
      "This browser does not support spoken prompts. Pictures and words are ready to play; a grown-up can read along.";
  function hub() {
    worldKey = null;
    current = null;
    stop();
    game.innerHTML = `<section class="hero"><div class="hero-copy"><span class="eyebrow">Sofi Learn · Ages 2–4</span><h1>A little wonder.<br>A lot to discover.</h1><p>Tap a world and explore together. Little steps, happy discoveries, and no rush.</p></div><div class="mascot" aria-hidden="true">🐣</div></section><div class="section-heading"><h2>Where shall we play?</h2><small>Six worlds of discovery</small></div><nav class="worlds" aria-label="Learning worlds">${Object.entries(
      worlds,
    )
      .map(
        ([key, w]) =>
          `<a class="world" href="#${key}" style="--tint:${w.color}"><span class="art" aria-hidden="true">${w.icon}</span><div><h3>${w.name}</h3><p>${w.hint}</p></div><span class="arrow" aria-hidden="true">↗</span></a>`,
      )
      .join(
        "",
      )}</nav><a class="bubble-banner" href="/bubble-cat/"><span class="art" aria-hidden="true">🫧</span><div><h2>Time for some bubbles?</h2><p>Pop and play with Bubble Cat.</p></div><span class="pill">Let’s pop →</span></a>`;
  }
  function symbol(item) {
    if (worldKey === "colors")
      return `<span class="swatch" style="background:${item[1]}" aria-hidden="true"></span>`;
    if (worldKey === "shapes")
      return `<span class="shape ${item[1]}" aria-hidden="true"></span>`;
    return `<span class="symbol" aria-hidden="true">${worldKey === "letters" || worldKey === "numbers" ? item[0] : item[1]}</span>`;
  }
  function lesson() {
    answered = false;
    counted = new Set();
    current = question(worldKey, round);
    const world = worlds[worldKey],
      t = current.target;
    let scene =
      worldKey === "numbers"
        ? Array.from(
            { length: Number(t[0]) },
            (_, i) =>
              `<button class="count-animal" data-animal="${i}" aria-label="Count ${t[2]}, animal ${i + 1}">${t[1]}</button>`,
          ).join("")
        : worldKey === "letters"
          ? `<button class="pill" id="example" aria-label="Hear ${t[0]} is for ${t[2]}"><span class="big" aria-hidden="true">${t[1]}</span></button>`
          : `<span class="big" aria-hidden="true">${world.icon}</span>`;
    game.innerHTML = `<div class="lesson-head"><a class="pill" href="#">⌂ All worlds</a><h1>${world.icon} ${world.name}</h1><span class="progress">${round + 1} of ${world.items.length}</span></div><section class="lesson" data-world="${worldKey}" aria-label="${world.name} activity"><div class="prompt-row"><h2 id="prompt">${current.prompt}</h2><button class="pill" id="repeat" aria-label="Hear the question again">🔊</button></div><div class="scene">${scene}</div><div class="choices">${current.choices.map((item, i) => `<button class="choice" data-answer="${i}" aria-label="${item[0]}">${symbol(item)}<span class="label">${item[0]}</span></button>`).join("")}</div><p class="feedback" role="status" aria-live="polite">${worldKey === "numbers" ? "Tap each animal to count together." : "Tap a picture. Let’s discover!"}</p><button class="pill next" id="next" disabled>Next →</button></section><div class="lesson-footer"><p>No timer. No lost hearts.<br>Take all the time you need.</p><button class="pill" id="help">💡 Help</button></div>`;
    document.querySelector("#repeat").onclick = () => say(current.prompt);
    document.querySelector("#help").onclick = () => {
      const hint =
        worldKey === "numbers"
          ? `Let’s count. Tap every animal once, then choose ${t[0]}.`
          : worldKey === "letters"
            ? `${t[0]} is for ${t[2]}. Find ${t[0]}.`
            : `Find ${t[0].toLowerCase()}. Look for the picture with the dotted outline.`;
      document.querySelector(".feedback").textContent = hint;
      say(hint);
      const right = Array.from(document.querySelectorAll(".choice")).find(
        (b) => current.choices[Number(b.dataset.answer)] === t,
      );
      right.classList.add("bounce", "hint");
      right.addEventListener(
        "animationend",
        () => right.classList.remove("bounce"),
        { once: true },
      );
    };
    document.querySelectorAll("[data-animal]").forEach(
      (button) =>
        (button.onclick = () => {
          const id = Number(button.dataset.animal);
          if (!counted.has(id)) {
            counted.add(id);
            button.classList.add("counted");
            button.setAttribute("aria-pressed", "true");
            const number = document.createElement("small");
            number.textContent = counted.size;
            button.append(number);
            button.dataset.count = counted.size;
          }
          say(button.dataset.count);
        }),
    );
    if (document.querySelector("#example"))
      document.querySelector("#example").onclick = () =>
        say(`${t[0]} is for ${t[2]}`);
    document
      .querySelectorAll("[data-answer]")
      .forEach((button) => (button.onclick = () => answer(button)));
    document.querySelector("#next").onclick = () => {
      round++;
      if (round === world.items.length) complete();
      else {
        lesson();
        say(current.prompt);
        document.querySelector("#repeat").focus({ preventScroll: true });
      }
    };
  }
  function answer(button) {
    if (answered) return;
    const selected = current.choices[Number(button.dataset.answer)],
      t = current.target;
    if (selected !== t) {
      button.classList.add("retry");
      document.querySelector(".feedback").textContent =
        `That’s ${selected[0]}. Let’s try again!`;
      say(`That’s ${selected[0]}. ${current.prompt}`);
      return;
    }
    answered = true;
    button.classList.add("correct");
    chime();
    const detail =
      worldKey === "numbers"
        ? `${t[0]} ${t[2]}!`
        : worldKey === "letters"
          ? `${t[0]} is for ${t[2]}!`
          : worldKey === "animals"
            ? `${t[0]}! ${t[2]}`
            : `${t[0]}!`;
    document.querySelector(".feedback").textContent =
      `⭐ ${detail} You found it!`;
    say(`${detail} You found it!`);
    document.querySelectorAll(".choice").forEach((b) => (b.disabled = true));
    document.querySelector("#next").disabled = false;
  }
  function complete() {
    current = null;
    game.innerHTML = `<section class="lesson"><div class="celebration" aria-hidden="true">🌟🐣🌟</div><span class="eyebrow">A lovely little discovery</span><h1>You did it!</h1><p>You explored ${worlds[worldKey].name.toLowerCase()}.<br>Let’s see what else we can find.</p><div class="complete-actions"><a class="pill next" href="#">Choose a world</a><button class="pill" id="again">↻ Play again</button></div></section>`;
    say("You did it! What a lovely discovery!");
    document.querySelector("#again").onclick = () => {
      round = 0;
      lesson();
      say(current.prompt);
    };
    document.querySelector(".next").focus({ preventScroll: true });
  }
  function route() {
    stop();
    const key = location.hash.slice(1);
    if (Object.hasOwn(worlds, key)) {
      worldKey = key;
      round = 0;
      lesson();
    } else hub();
  }
  // Initiate narration in the tap gesture, which mobile browsers require.
  game.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    event.preventDefault();
    const key = link.getAttribute("href").slice(1);
    history.pushState(null, "", link.getAttribute("href"));
    route();
    if (Object.hasOwn(worlds, key))
      say(`Let’s explore ${worlds[key].name}. ${current.prompt}`);
  });
  window.addEventListener("popstate", route);
  window.addEventListener("hashchange", route);
  window.addEventListener("pagehide", stop);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
      if (context) context.suspend().catch(() => {});
    }
  });
  route();
})();
