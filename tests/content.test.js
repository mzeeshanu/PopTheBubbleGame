const { test } = require("node:test");
const assert = require("node:assert/strict");
const { worlds, question } = require("../site/learn/content");

for (const [key, world] of Object.entries(worlds)) {
  test(`${key}: every lesson has one correct answer and two distinct distractors`, () => {
    for (let round = 0; round < world.items.length; round++) {
      for (let run = 0; run < 100; run++) {
        const q = question(key, round);
        assert.equal(q.choices.length, 3);
        assert.equal(new Set(q.choices.map((item) => item[0])).size, 3);
        assert.equal(q.choices.filter((item) => item === q.target).length, 1);
        assert.equal(q.target, world.items[round]);
        assert.ok(q.choices.every((item) => world.items.includes(item)));
      }
    }
  });
}
test("answer positions vary rather than always revealing the correct choice", () => {
  const positions = new Set();
  for (const value of [0, 0.25, 0.4, 0.5, 0.75, 0.999]) {
    const q = question("numbers", 0, () => value);
    positions.add(q.choices.indexOf(q.target));
  }
  assert.equal(positions.size, 3);
});
test("counting content stays within 1–5 and uses a plural question", () => {
  assert.deepEqual(
    worlds.numbers.items.map((item) => Number(item[0])),
    [1, 2, 3, 4, 5],
  );
  assert.equal(question("numbers", 0).prompt, "How many cats?");
});
