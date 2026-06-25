import { readFile } from 'node:fs/promises';
import { modules } from '../src/storyData.js';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');

const failures = [];

if (!html.includes('src="./src/main.js"')) failures.push('index.html must load the app entry point.');
if (!main.includes("from '../vendor/three.module.js'")) failures.push('main.js must use the vendored Three.js module.');
if (!css.includes('@media (max-width: 560px)')) failures.push('styles.css must include a narrow mobile layout.');

modules.forEach((module) => {
  if (!module.reference.startsWith('Genesis')) failures.push(`${module.id} is missing a Genesis reference.`);
  if (module.story.length < 3) failures.push(`${module.id} needs at least three story beats.`);
  if (!module.milestoneTitle) failures.push(`${module.id} is missing a milestone title.`);
  if (!module.milestonePlace) failures.push(`${module.id} is missing a milestone place.`);
  if (!module.summary) failures.push(`${module.id} is missing a popup summary.`);
  if (!module.scripture || !module.scriptureReference) failures.push(`${module.id} is missing a scripture quote.`);
  if (!module.art) failures.push(`${module.id} is missing popup art.`);
  if (!Array.isArray(module.questions) || module.questions.length !== 10) {
    failures.push(`${module.id} needs exactly 10 quiz questions.`);
  } else {
    module.questions.forEach((question, index) => {
      if (!question.prompt) failures.push(`${module.id} question ${index + 1} is missing a prompt.`);
      if (question.answers.length !== 3) failures.push(`${module.id} question ${index + 1} needs exactly three answers.`);
      if (question.correctIndex < 0 || question.correctIndex > 2) {
        failures.push(`${module.id} question ${index + 1} has an invalid correct answer index.`);
      }
    });
  }
});

await Promise.all(
  modules.map(async (module) => {
    try {
      await readFile(new URL(`../${module.art}`, import.meta.url));
    } catch {
      failures.push(`${module.id} references missing art file ${module.art}.`);
    }
  })
);

if (!modules.some((module) => module.game.type === 'collect')) {
  failures.push('At least one module must include a playable 3D collect game.');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Validated ${modules.length} Joseph modules.`);
