(function (root) {
  "use strict";
  const worlds = {
    numbers: {
      name: "Numbers",
      icon: "🐥",
      hint: "Count little friends",
      color: "#e6efcf",
      items: [
        ["1", "🐱", "cat"],
        ["2", "🦆", "ducks"],
        ["3", "🐰", "bunnies"],
        ["4", "🐸", "frogs"],
        ["5", "🐥", "chicks"],
      ],
    },
    letters: {
      name: "Letters",
      icon: "🔤",
      hint: "Meet the ABCs",
      color: "#eae3f5",
      items: [
        ["A", "🍎", "apple"],
        ["B", "⚽", "ball"],
        ["C", "🐱", "cat"],
        ["D", "🐶", "dog"],
        ["E", "🐘", "elephant"],
        ["F", "🐟", "fish"],
      ],
    },
    colors: {
      name: "Colors",
      icon: "🎨",
      hint: "A rainbow to explore",
      color: "#fbe3da",
      items: [
        ["Red", "#e94c4c"],
        ["Blue", "#347bd2"],
        ["Yellow", "#f5cd32"],
        ["Green", "#59a450"],
        ["Orange", "#f18c30"],
        ["Purple", "#9664c8"],
      ],
    },
    animals: {
      name: "Animals",
      icon: "🦁",
      hint: "Say hello to animals",
      color: "#fcf0cb",
      items: [
        ["Cat", "🐱", "Meow, meow!"],
        ["Duck", "🦆", "Quack, quack!"],
        ["Cow", "🐮", "Moo!"],
        ["Dog", "🐶", "Woof, woof!"],
        ["Sheep", "🐑", "Baa!"],
        ["Pig", "🐷", "Oink, oink!"],
      ],
    },
    shapes: {
      name: "Shapes",
      icon: "🔺",
      hint: "Find a familiar shape",
      color: "#deedf8",
      items: [
        ["Circle", "circle"],
        ["Square", "square"],
        ["Triangle", "triangle"],
        ["Star", "star"],
        ["Heart", "heart"],
        ["Rectangle", "rectangle"],
      ],
    },
    objects: {
      name: "Objects",
      icon: "🧸",
      hint: "Everyday little wonders",
      color: "#f7e2ec",
      items: [
        ["Ball", "⚽"],
        ["Car", "🚗"],
        ["Teddy bear", "🧸"],
        ["Apple", "🍎"],
        ["Shoe", "👟"],
        ["Book", "📚"],
      ],
    },
  };
  function question(key, index, random = Math.random) {
    const world = worlds[key];
    const target = world.items[index % world.items.length];
    const shuffle = (items) => {
      const a = [...items];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const choices = shuffle([
      target,
      ...shuffle(world.items.filter((item) => item !== target)).slice(0, 2),
    ]);
    const prompt =
      key === "numbers"
        ? `How many ${target[2] === "cat" ? "cats" : target[2]}?`
        : key === "letters"
          ? `Find the letter ${target[0]}`
          : `Find ${key === "colors" ? "" : "the "}${target[0].toLowerCase()}`;
    return { target, choices, prompt };
  }
  root.SofiContent = { worlds, question };
  if (typeof module !== "undefined") module.exports = root.SofiContent;
})(typeof window === "undefined" ? globalThis : window);
