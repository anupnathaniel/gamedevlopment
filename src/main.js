import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/meshopt_decoder.mjs';
import { modules } from './storyData.js';

const app = document.querySelector('#app');
const xpRewards = {
  question: 10,
  game: 50
};

function createQuizProgress() {
  return Object.fromEntries(
    modules.map((module) => [
      module.id,
      {
        currentIndex: 0,
        choices: {},
        completed: new Set()
      }
    ])
  );
}

const state = {
  screen: 'landing',
  activeModuleId: modules[0].id,
  selectedMilestoneId: null,
  mapMenuCollapsed: false,
  step: 'learn',
  quizProgress: createQuizProgress(),
  completed: new Set(),
  gameXpAwarded: new Set(),
  gameStatus: 'idle',
  collected: 0,
  audioMuted: false
};

let miniGame = null;

const milestonePositions = [
  { id: 'dreamer', x: 52.9, y: 12.4 },
  { id: 'pit', x: 67.6, y: 32.8 },
  { id: 'faithful', x: 63, y: 42.9 },
  { id: 'prison', x: 60.7, y: 53.5 },
  { id: 'palace', x: 60.8, y: 68.8 },
  { id: 'reunion', x: 59.2, y: 85.4 }
];

const josephModelPath =
  './assets/characters/joseph-v2/Prince_in_a_Multicolo_biped_Animation_Walking_withSkin.glb';
const josephRunModelPath =
  './assets/characters/joseph-v2/Prince_in_a_Multicolo_biped_Animation_Running_withSkin.glb';
const josephJumpModelPath =
  './assets/characters/joseph-v2/Prince_in_a_Multicolo_biped_Animation_Jump_Run_withSkin.glb';
const jacobModelPath =
  './assets/characters/jacob/Wandering_Elder_with__biped_Character_output.glb';
const environmentModelPaths = {
  mountain: './assets/environment/mountains/mountain_01.glb',
  tree: './assets/environment/trees/olive_tree_01.glb',
  rock: './assets/environment/rocks/rock_01.glb',
  shrub: './assets/environment/shrubs/dry_shrub_01.glb',
  palm: './assets/environment/palms/palm_tree.glb',
  smallTent: './assets/environment/tents/small_tent.glb',
  bigTent: './assets/environment/tents/big_tent.glb'
};
const animalModelPaths = {
  sheep: './assets/animals/sheep_walking.glb',
  camel: './assets/animals/camel_walking.glb'
};
const birdModelPaths = {
  heron: './assets/animals/birds/heron.glb',
  falcon: './assets/animals/birds/falcon.glb',
  hoopoe: './assets/animals/birds/hoopoe.glb',
  raven: './assets/animals/birds/raven.glb',
  dove: './assets/animals/birds/dove.glb'
};
const gameAudioPath = './assets/audio/bg_game_audio_journey_of_promise.mp3';
const starPickupAudioPath = './assets/audio/star-picked.wav';

function activeModule() {
  return modules.find((module) => module.id === state.activeModuleId) || modules[0];
}

function setState(patch) {
  Object.assign(state, patch);
  render();
}

function quizState(module) {
  if (!state.quizProgress[module.id]) {
    state.quizProgress[module.id] = {
      currentIndex: 0,
      choices: {},
      completed: new Set()
    };
  }
  return state.quizProgress[module.id];
}

function moduleQuestions(module) {
  return module.questions || [];
}

function completedQuestionCount(module) {
  return quizState(module).completed.size;
}

function isModuleQuizComplete(module) {
  const questions = moduleQuestions(module);
  return questions.length > 0 && completedQuestionCount(module) === questions.length;
}

function completeModule(moduleId) {
  state.completed.add(moduleId);
  setState({ step: 'learn', gameStatus: 'idle' });
}

function earnedQuestionXp(module) {
  return completedQuestionCount(module) * xpRewards.question;
}

function earnedGameXp(module) {
  return state.gameXpAwarded.has(module.id) ? xpRewards.game : 0;
}

function moduleXp(module) {
  return earnedQuestionXp(module) + earnedGameXp(module);
}

function moduleMaxXp(module) {
  const gameXp = module.game.type === 'collect' ? xpRewards.game : 0;
  return moduleQuestions(module).length * xpRewards.question + gameXp;
}

function totalXp() {
  return modules.reduce((sum, module) => sum + moduleXp(module), 0);
}

function totalMaxXp() {
  return modules.reduce((sum, module) => sum + moduleMaxXp(module), 0);
}

function render() {
  if (state.screen === 'landing') {
    app.innerHTML = landingView();
    bindEvents();
    disposeMiniGame();
    return;
  }

  if (state.screen === 'map') {
    app.innerHTML = mapView();
    bindEvents();
    disposeMiniGame();
    return;
  }

  const module = activeModule();
  const quizComplete = isModuleQuizComplete(module);
  app.innerHTML = `
    <main class="shell">
      <aside class="module-rail" aria-label="Joseph story modules">
        <div class="brand">
          <span class="brand-mark">J</span>
          <div>
            <p>Joseph Story Quest</p>
            <span>Genesis 37-50</span>
          </div>
        </div>
        <nav class="module-list">
          ${modules
            .map(
              (item, index) => `
                <button class="module-tab ${item.id === module.id ? 'active' : ''}" data-module="${item.id}">
                  <span class="module-number">${index + 1}</span>
                  <span>
                    <strong>${item.title}</strong>
                    <small>${item.reference}</small>
                  </span>
                  ${state.completed.has(item.id) ? '<span class="done-dot" aria-label="Completed"></span>' : ''}
                </button>
              `
            )
            .join('')}
        </nav>
        <div class="xp-summary" aria-label="Experience points">
          <span>${totalXp()} XP</span>
          <small>${totalMaxXp()} XP available</small>
        </div>
      </aside>

      <section class="workspace">
        <header class="story-header" style="--header-art: url('../${module.art}')">
          <div>
            <p class="eyebrow">${module.location}</p>
            <h1>${module.title}</h1>
            <p>${module.theme}</p>
          </div>
          <div class="header-tools">
            <button class="ghost-action" data-map>Journey Map</button>
          </div>
        </header>

        <div class="mode-tabs" role="tablist" aria-label="Module sections">
          <button class="${state.step === 'learn' ? 'selected' : ''}" data-step="learn">Story</button>
          <button class="${state.step === 'quiz' ? 'selected' : ''}" data-step="quiz">Check</button>
          <button class="${state.step === 'game' ? 'selected' : ''}" data-step="game" ${!quizComplete ? 'disabled' : ''}>3D Game</button>
        </div>

        <div class="content-area">
          ${state.step === 'learn' ? storyView(module) : ''}
          ${state.step === 'quiz' ? quizView(module) : ''}
          ${state.step === 'game' ? gameView(module) : ''}
        </div>
      </section>
    </main>
  `;

  bindEvents();

  if (state.step === 'game' && module.game.type === 'collect') {
    mountCollectGame(module);
  } else {
    disposeMiniGame();
  }
}

function landingView() {
  return `
    <main class="landing-shell">
      <section class="landing-hero" aria-labelledby="landing-title">
        <div class="landing-content">
          <p class="landing-kicker">A Biblical Journey · Genesis 37-50</p>
          <h1 id="landing-title">Walk the Path of Joseph</h1>
          <p class="landing-copy">
            Follow the dreamer from his father's tents in Canaan to the throne of Egypt.
            At each milestone, read the story, answer a question, and continue the journey.
          </p>
          <button class="landing-action" data-begin>Begin the Journey</button>
          <p class="landing-note">${modules.length} milestones · Story path from Genesis</p>
        </div>
      </section>
    </main>
  `;
}

function mapView() {
  const selectedModule = modules.find((module) => module.id === state.selectedMilestoneId) || null;
  const selectedIndex = selectedModule ? modules.findIndex((module) => module.id === selectedModule.id) : -1;
  const selectedQuizComplete = selectedModule ? isModuleQuizComplete(selectedModule) : false;
  const progressPercent = Math.round((state.completed.size / modules.length) * 100);

  return `
    <main class="map-shell">
      <header class="map-topbar">
        <div class="map-brand">
          <span class="map-brand-mark">J</span>
          <div>
            <strong>The Journey of Joseph</strong>
            <small>From the pit to the palace</small>
          </div>
        </div>
        <div class="map-status">
          <span>${totalXp()} XP</span>
          <small>Wisdom Points</small>
        </div>
      </header>
      <div class="map-layout ${state.mapMenuCollapsed ? 'menu-collapsed' : ''}">
        <aside class="map-chapters ${state.mapMenuCollapsed ? 'collapsed' : ''}" aria-label="Journey chapters">
          <button class="map-menu-toggle" data-toggle-map-menu aria-label="${state.mapMenuCollapsed ? 'Expand journey chapters' : 'Collapse journey chapters'}">
            <span>${state.mapMenuCollapsed ? '›' : '‹'}</span>
          </button>
          <p class="map-panel-title">Journey Chapters</p>
          <div class="map-chapter-list">
            ${modules
              .map(
                (module, index) => `
                  <button class="map-chapter ${module.id === selectedModule?.id ? 'active' : ''}" data-milestone="${module.id}">
                    <span class="map-chapter-number">${index + 1}</span>
                    <span>
                      <strong>${module.milestoneTitle}</strong>
                      <small>${module.reference}</small>
                    </span>
                  </button>
                `
              )
              .join('')}
          </div>
          <div class="map-progress-card">
            <small>Your Progress</small>
            <strong>${progressPercent}%</strong>
            <span>Journey Complete</span>
            <div class="map-progress-track"><span style="width: ${progressPercent}%"></span></div>
            <p>"You meant evil against me, but God meant it for good."</p>
            <small>Genesis 50:20</small>
          </div>
        </aside>

        <section class="journey-map" aria-labelledby="map-title">
          <header class="map-header">
            <p class="map-kicker">Genesis 37-50</p>
            <h1 id="map-title">Follow Joseph's Journey to Egypt</h1>
          </header>

          <div class="map-board">
            ${milestonePositions
              .map((point, index) => {
                const module = modules.find((item) => item.id === point.id);
                return `
                  <button
                    class="milestone ${module.id === selectedModule?.id ? 'active' : ''} ${state.completed.has(point.id) ? 'completed' : ''}"
                    style="left: ${point.x}%; top: ${point.y}%"
                    data-milestone="${point.id}"
                    aria-label="${module.milestoneTitle}, ${module.reference}"
                  >
                    <span class="milestone-pin">
                      <span>${index + 1}</span>
                    </span>
                    <span class="milestone-copy">
                      <strong>${module.milestoneTitle}</strong>
                      <small>${module.reference}</small>
                    </span>
                  </button>
                `;
              })
              .join('')}
          </div>
        </section>
      </div>
      ${
        selectedModule
          ? `
            <button class="map-detail-backdrop" data-close-map-detail aria-label="Close milestone details"></button>
            <aside class="map-detail-card" aria-label="Selected milestone">
              <button class="map-detail-close" data-close-map-detail aria-label="Close milestone details">&times;</button>
              <img src="${selectedModule.art}" alt="" />
              <p class="map-kicker">${selectedModule.reference}</p>
              <h2>${selectedModule.milestoneTitle}</h2>
              <p>${selectedModule.summary}</p>
              <div class="map-rewards">
                <span><strong>+${xpRewards.question} XP</strong><small>Wisdom Points</small></span>
                <span><strong>${selectedQuizComplete ? 'Ready' : 'Locked'}</strong><small>3D Journey</small></span>
              </div>
              <button class="primary-action" data-start-module="${selectedModule.id}">Continue Story</button>
              <button class="ghost-action" data-start-game="${selectedModule.id}" ${!selectedQuizComplete || selectedModule.game.type !== 'collect' ? 'disabled' : ''}>Enter 3D Challenge</button>
            </aside>
          `
          : ''
      }
      <nav class="map-bottom-nav" aria-label="Quest sections">
        <span>Bible Stories</span>
        <span class="active">Journey Map</span>
        <span>Wisdom Points · ${totalXp()} XP</span>
        <span>Achievements</span>
      </nav>
    </main>
  `;
}

function storyView(module) {
  return `
    <article class="story-panel">
      <div class="reference-pill">${module.reference}</div>
      <ol class="story-beats">
        ${module.story.map((beat) => `<li>${beat}</li>`).join('')}
      </ol>
      <button class="primary-action" data-step="quiz">Answer the 10 Questions</button>
    </article>
  `;
}

function quizView(module) {
  const questions = moduleQuestions(module);
  const progress = quizState(module);
  const currentIndex = Math.min(progress.currentIndex, questions.length - 1);
  progress.currentIndex = currentIndex;
  const question = questions[currentIndex];
  const selectedAnswer = progress.choices[currentIndex];
  const answered = selectedAnswer !== undefined;
  const correct = progress.completed.has(currentIndex);
  const completeCount = completedQuestionCount(module);
  const quizComplete = isModuleQuizComplete(module);

  return `
    <article class="quiz-panel">
      <div class="quiz-heading">
        <p class="eyebrow">Story Check</p>
        <div class="quiz-title-row">
          <h2>Question ${currentIndex + 1}</h2>
          <p>${completeCount}/${questions.length} complete · ${earnedQuestionXp(module)} XP</p>
        </div>
        <div class="quiz-progress-track" aria-hidden="true">
          <span style="width: ${(completeCount / questions.length) * 100}%"></span>
        </div>
      </div>
      <div class="question-strip" aria-label="Question progress">
        ${questions
          .map(
            (_, index) => `
              <button
                class="question-chip ${index === currentIndex ? 'active' : ''} ${
                  progress.completed.has(index) ? 'complete' : ''
                }"
                data-quiz-go="${index}"
                aria-label="Go to question ${index + 1}"
              ><span>${index + 1}</span></button>
            `
          )
          .join('')}
      </div>
      <h3 class="question-prompt">${question.prompt}</h3>
      <div class="answer-list">
        ${question.answers
          .map(
            (answer, index) => `
              <button class="answer ${
                answered && index === question.correctIndex ? 'correct' : ''
              } ${answered && index === selectedAnswer && !correct ? 'wrong' : ''}" data-answer="${index}" data-question-index="${currentIndex}">
                ${answer}
              </button>
            `
          )
          .join('')}
      </div>
      ${
        answered
          ? `<div class="feedback ${correct ? 'good' : 'try'}">${
              correct
                ? `Correct. Question ${currentIndex + 1} is marked complete.`
                : 'Not quite. Look back at the story beats and try this question again.'
            }</div>`
          : ''
      }
      <div class="quiz-actions">
        <button class="ghost-action" data-quiz-go="${Math.max(0, currentIndex - 1)}" ${
          currentIndex === 0 ? 'disabled' : ''
        }>Previous</button>
        <button class="ghost-action" data-quiz-go="${Math.min(questions.length - 1, currentIndex + 1)}" ${
          currentIndex === questions.length - 1 ? 'disabled' : ''
        }>Next</button>
        <button class="primary-action" data-step="game" ${!quizComplete ? 'disabled' : ''}>Start 3D Challenge</button>
      </div>
      <p class="xp-note">+${xpRewards.question} XP for each correct answer. Finish the 3D challenge for +${xpRewards.game} XP.</p>
    </article>
  `;
}

function gameView(module) {
  if (!isModuleQuizComplete(module)) {
    const questions = moduleQuestions(module);
    return `
      <article class="locked-game">
        <p class="eyebrow">${module.challengeName}</p>
        <h2>Complete all 10 questions to unlock the 3D challenge.</h2>
        <p>${completedQuestionCount(module)}/${questions.length} complete. Finish the story check first, then the game will open.</p>
        <p class="xp-note">${earnedQuestionXp(module)} XP earned · ${xpRewards.game} XP game reward</p>
        <button class="primary-action" data-step="quiz">Continue Questions</button>
      </article>
    `;
  }

  if (module.game.type !== 'collect') {
    return `
      <article class="locked-game">
        <p class="eyebrow">${module.challengeName}</p>
        <h2>${module.game.objective}</h2>
        <p>This slot is ready for the next playable scene. The first module already demonstrates the 3D game pattern.</p>
        <button class="primary-action" data-complete="${module.id}">Mark Module Complete</button>
      </article>
    `;
  }

  return `
    <section class="game-fullscreen is-loading" aria-label="${module.challengeName}">
      <div class="game-topbar">
        <div>
          <p class="eyebrow">${module.challengeName}</p>
          <h2>${module.game.objective}</h2>
        </div>
        <div class="hud">
          <span><strong data-stars>${state.collected}</strong>/7 stars</span>
          <span><strong data-xp>${moduleXp(module)}</strong> XP</span>
        </div>
      </div>
      <div class="zoom-controls" aria-label="Camera zoom controls">
        <button data-zoom="in" aria-label="Zoom in">+</button>
        <button data-zoom="out" aria-label="Zoom out">-</button>
      </div>
      <button
        class="sound-toggle"
        data-sound-toggle
        aria-pressed="${state.audioMuted ? 'true' : 'false'}"
        aria-label="${state.audioMuted ? 'Unmute game sound' : 'Mute game sound'}"
        title="${state.audioMuted ? 'Unmute game sound' : 'Mute game sound'}"
      >
        <span class="sound-icon sound-icon-on" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M11 5 6 9H3v6h3l5 4V5Z"></path>
            <path d="M15.5 8.5a5 5 0 0 1 0 7"></path>
            <path d="M18.5 5.5a9 9 0 0 1 0 13"></path>
          </svg>
        </span>
        <span class="sound-icon sound-icon-off" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M11 5 6 9H3v6h3l5 4V5Z"></path>
            <path d="m16 9 5 5"></path>
            <path d="m21 9-5 5"></path>
          </svg>
        </span>
      </button>
      <button class="game-close" data-close-game aria-label="Close 3D game">&times;</button>
      <div class="game-stage fullscreen-stage" id="game-stage" aria-label="3D dream star collection game"></div>
      <div class="jacob-response" data-jacob-response aria-live="polite"></div>
      <div class="game-loading" data-game-loading role="status" aria-live="polite">
        <span class="loading-mark"></span>
        <p class="game-panel-kicker" data-loading-kicker>Preparing the Scene</p>
        <strong data-loading-title>Gather the Dreams</strong>
        <ul class="loading-instructions">
          <li>Collect all 7 dream stars around the field.</li>
        </ul>
        <button class="primary-action loading-play" data-game-action="start" disabled>Loading...</button>
      </div>
      <div class="game-overlay-panel is-hidden" data-game-panel data-status="${state.gameStatus}">
        <p class="game-panel-kicker" data-result-title>${gamePanelTitle()}</p>
        <p class="game-result" data-result>${gameResultText(module)}</p>
        <p class="game-reward" data-game-reward>${gameRewardText(module)}</p>
        <div class="game-actions">
          <button class="primary-action" data-game-action="restart">${state.gameStatus === 'won' ? 'Play Again' : 'Restart'}</button>
          <button class="ghost-action dark" data-dismiss-game-panel>${state.gameStatus === 'won' ? 'Close Game' : 'Close'}</button>
        </div>
      </div>
      <div class="orientation-hint" aria-hidden="true">
        <strong>Rotate for best play</strong>
        <span>Use landscape mode for the 3D challenge.</span>
      </div>
      <div class="touch-controls" aria-label="Movement controls">
        <div class="dpad" aria-label="Movement D-pad">
          <button data-control="up" aria-label="Move up">&uarr;</button>
          <button data-control="left" aria-label="Move left">&larr;</button>
          <button data-control="down" aria-label="Move down">&darr;</button>
          <button data-control="right" aria-label="Move right">&rarr;</button>
        </div>
        <div class="action-pad" aria-label="Action controls">
          <button data-control="jump" aria-label="Jump">Jump</button>
          <button data-control="run" aria-label="Run">Run</button>
        </div>
      </div>
    </section>
  `;
}

function gameResultText(module) {
  if (state.gameStatus === 'won') return module.game.winMessage;
  if (state.collected >= 7) return 'All stars gathered. Bring Joseph back to Jacob to finish the journey.';
  return 'Collect every dream star, then bring Joseph to Jacob to complete the challenge.';
}

function gamePanelTitle() {
  if (state.gameStatus === 'won') return 'Challenge Complete';
  return 'Ready';
}

function gameRewardText(module) {
  if (state.gameStatus === 'won') {
    return state.gameXpAwarded.has(module.id)
      ? `Reward earned: +${xpRewards.game} XP. Module total: ${moduleXp(module)}/${moduleMaxXp(module)} XP.`
      : `Reward available: +${xpRewards.game} XP.`;
  }
  return `Questions: ${earnedQuestionXp(module)} XP · Game completion: +${xpRewards.game} XP.`;
}

function bindEvents() {
  document.querySelectorAll('[data-begin]').forEach((button) => {
    button.addEventListener('click', () => {
      setState({ screen: 'map', selectedMilestoneId: null });
    });
  });

  document.querySelectorAll('[data-map]').forEach((button) => {
    button.addEventListener('click', () => {
      setState({ screen: 'map', selectedMilestoneId: null, gameStatus: 'idle' });
    });
  });

  document.querySelectorAll('[data-toggle-map-menu]').forEach((button) => {
    button.addEventListener('click', () => {
      setState({ mapMenuCollapsed: !state.mapMenuCollapsed });
    });
  });

  document.querySelectorAll('[data-milestone]').forEach((button) => {
    button.addEventListener('click', () => {
      setState({ selectedMilestoneId: button.dataset.milestone });
    });
  });

  document.querySelectorAll('[data-close-map-detail]').forEach((button) => {
    button.addEventListener('click', () => {
      setState({ selectedMilestoneId: null });
    });
  });

  document.querySelectorAll('[data-start-module]').forEach((button) => {
    button.addEventListener('click', () => {
      setState({
        screen: 'modules',
        selectedMilestoneId: null,
        activeModuleId: button.dataset.startModule,
        step: 'learn',
        gameStatus: 'idle',
        collected: 0,
      });
    });
  });

  document.querySelectorAll('[data-start-game]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      setState({
        screen: 'modules',
        selectedMilestoneId: null,
        activeModuleId: button.dataset.startGame,
        step: 'game',
        gameStatus: 'idle',
        collected: 0,
      });
    });
  });

  document.querySelectorAll('[data-module]').forEach((button) => {
    button.addEventListener('click', () => {
      setState({
        screen: 'modules',
        activeModuleId: button.dataset.module,
        step: 'learn',
        gameStatus: 'idle',
        collected: 0,
      });
    });
  });

  document.querySelectorAll('[data-step]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      setState({ step: button.dataset.step });
    });
  });

  document.querySelectorAll('[data-quiz-go]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      const module = activeModule();
      const progress = quizState(module);
      progress.currentIndex = Number(button.dataset.quizGo);
      setState({});
    });
  });

  document.querySelectorAll('[data-close-game]').forEach((button) => {
    button.addEventListener('click', () => {
      setState({ step: 'learn', gameStatus: 'idle', collected: 0 });
    });
  });

  document.querySelectorAll('[data-dismiss-game-panel]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.gameStatus === 'won') {
        setState({ step: 'learn', gameStatus: 'idle', collected: 0 });
        return;
      }
      document.querySelector('.game-overlay-panel')?.classList.add('is-hidden');
    });
  });

  document.querySelectorAll('[data-answer]').forEach((button) => {
    button.addEventListener('click', () => {
      const module = activeModule();
      const progress = quizState(module);
      const questionIndex = Number(button.dataset.questionIndex);
      const answerIndex = Number(button.dataset.answer);
      const question = moduleQuestions(module)[questionIndex];
      progress.choices[questionIndex] = answerIndex;
      if (question && answerIndex === question.correctIndex) {
        progress.completed.add(questionIndex);
      }
      setState({});
    });
  });

  document.querySelectorAll('[data-game-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      if (miniGame) miniGame.start();
    });
  });

  document.querySelectorAll('[data-complete]').forEach((button) => {
    button.addEventListener('click', () => completeModule(button.dataset.complete));
  });
}

function mountCollectGame(module) {
  const stage = document.querySelector('#game-stage');
  if (!stage) return;

  disposeMiniGame();
  miniGame = createCollectGame(stage, module);
}

function disposeMiniGame() {
  if (miniGame) {
    miniGame.dispose();
    miniGame = null;
  }
}

function loadGltf(loader, path) {
  return new Promise((resolve, reject) => {
    loader.load(path, resolve, undefined, reject);
  });
}

function prefersLightweightGameMode() {
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
  const narrowViewport = window.matchMedia?.('(max-width: 820px)').matches;
  const lowMemory = navigator.deviceMemory ? navigator.deviceMemory <= 4 : false;
  return Boolean(coarsePointer || narrowViewport || lowMemory);
}

function createCollectGame(stage, module) {
  stage.dataset.character = 'fallback';
  stage.dataset.jacob = 'fallback';
  const lightweightMode = prefersLightweightGameMode();
  stage.dataset.performanceMode = lightweightMode ? 'lightweight' : 'full';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a2238);
  scene.fog = new THREE.Fog(0x1a2238, 28, 78);

  const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 160);
  camera.position.set(0, 2.4, 8.5);
  camera.lookAt(0, 1.2, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: !lightweightMode, powerPreference: 'high-performance' });
  renderer.setPixelRatio(lightweightMode ? 1 : Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = !lightweightMode;
  stage.appendChild(renderer.domElement);

  const sky = createTwilightSky();
  scene.add(sky);

  const ambient = new THREE.HemisphereLight(0xd9c6ff, 0x25344c, 1.15);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffc27d, 1.6);
  sun.position.set(-12, 9, 10);
  sun.castShadow = !lightweightMode;
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  scene.add(sun);

  const moonGlow = new THREE.DirectionalLight(0x9ebcff, 0.8);
  moonGlow.position.set(8, 7, -12);
  scene.add(moonGlow);

  const arenaRadius = 28.8;
  const playerSpeed = 7;
  const runMultiplier = 1.65;
  const jumpStrength = 6.8;
  const gravity = 18;
  const playerBaseY = 0.55;
  const jacobPosition = new THREE.Vector3(18, 0.55, -22);
  const cameraOffset = new THREE.Vector3(0, 1.2, 6.2);
  const cameraTarget = new THREE.Vector3();
  const cameraDesiredPosition = new THREE.Vector3();
  const movementDirection = new THREE.Vector3();
  const minCameraDistance = 4.2;
  const maxCameraDistance = 16;
  let cameraDistance = cameraOffset.z;

  const starPositions = [
    [-10.4, 8.7],
    [8.8, 7.8],
    [-19, -0.7],
    [17.8, -2.5],
    [-12.4, -13.8],
    [10.7, -16.4],
    [0, -20.1]
  ];

  const ground = createGrassArenaGround(starPositions, jacobPosition);
  scene.add(ground);

  const fallbackEnvironment = createFallbackEnvironment();
  scene.add(fallbackEnvironment);
  const animalScene = createAnimalScene(starPositions, jacobPosition);
  scene.add(animalScene.group);
  const birdScene = createBirdScene(jacobPosition);
  scene.add(birdScene.group);

  const robe = new THREE.Group();
  const placeholder = createFallbackJoseph();
  robe.add(placeholder);
  robe.position.y = 0.55;
  scene.add(robe);

  const jacob = new THREE.Group();
  const jacobPlaceholder = createFallbackJacob();
  jacob.add(jacobPlaceholder);
  jacob.position.copy(jacobPosition);
  scene.add(jacob);

  const deliveryRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.05, 12, 64),
    new THREE.MeshStandardMaterial({ color: 0xf4d06f, emissive: 0x7c4d00, roughness: 0.45 })
  );
  deliveryRing.position.set(jacobPosition.x, 0.08, jacobPosition.z);
  deliveryRing.rotation.x = Math.PI / 2;
  deliveryRing.visible = false;
  scene.add(deliveryRing);

  const deliveryBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xffdf72, emissive: 0xc88412, roughness: 0.25 })
  );
  deliveryBeacon.position.set(jacobPosition.x, 2.95, jacobPosition.z);
  deliveryBeacon.visible = false;
  scene.add(deliveryBeacon);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let josephWalkModel = null;
  let josephRunModel = null;
  let josephJumpModel = null;
  let walkMixer = null;
  let runMixer = null;
  let jumpMixer = null;
  let walkAction = null;
  let runAction = null;
  let jumpAction = null;
  let wasMoving = false;
  let activeJosephMode = 'idle';
  let disposed = false;
  const gameShell = stage.closest('.game-fullscreen');
  const loadingEl = gameShell?.querySelector('[data-game-loading]');
  const loadingTitleEl = gameShell?.querySelector('[data-loading-title]');
  const loadingKickerEl = gameShell?.querySelector('[data-loading-kicker]');
  const loadingPlayButton = gameShell?.querySelector('.loading-play');
  const readyTasks = [];

  const markGameReady = (readyState) => {
    if (disposed) return;
    stage.dataset.ready = readyState;
    gameShell?.classList.remove('is-loading');
    gameShell?.classList.add('is-ready');
    if (loadingKickerEl) loadingKickerEl.textContent = readyState === 'timeout' ? 'Ready Enough' : 'Scene Ready';
    if (loadingTitleEl) loadingTitleEl.textContent = 'Begin the Challenge';
    if (loadingPlayButton) {
      loadingPlayButton.disabled = false;
      loadingPlayButton.textContent = 'Play';
    }
  };

  const trackReadyTask = (task) => {
    readyTasks.push(Promise.resolve(task).catch(() => false));
  };

  const revealGameWhenReady = () => {
    const safetyTimer = setTimeout(() => {
      markGameReady('timeout');
    }, lightweightMode ? 9000 : 15000);

    Promise.allSettled(readyTasks).then(() => {
      if (disposed) return;
      clearTimeout(safetyTimer);
      markGameReady('true');
    });
  };

  trackReadyTask(loadEnvironmentAssets(loader, scene, fallbackEnvironment, () => disposed, stage, !lightweightMode));

  if (lightweightMode) {
    stage.dataset.animals = 'fallback';
    stage.dataset.birds = 'fallback';
  } else {
    trackReadyTask(loadAnimalAssets(loader, animalScene, () => disposed, stage));
    trackReadyTask(loadBirdAssets(loader, birdScene, () => disposed, stage));
  }

  trackReadyTask(
    loadGltf(loader, josephModelPath)
      .then((gltf) => {
      if (disposed) {
        disposeObject(gltf.scene);
        return false;
      }
      robe.remove(placeholder);
      disposeObject(placeholder);

      const model = gltf.scene;
      josephWalkModel = model;
      normalizeModelToHeight(model, 2);
      model.position.y -= 0.5;
      model.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = !lightweightMode;
          object.receiveShadow = true;
        }
      });
      robe.add(model);

      if (gltf.animations.length) {
        walkMixer = new THREE.AnimationMixer(model);
        walkAction = walkMixer.clipAction(gltf.animations[0]);
        walkAction.play();
        holdJosephIdlePose();
      }
      stage.dataset.character = 'glb';
      return true;
    })
      .catch((error) => {
        console.warn('Joseph GLB failed to load, using fallback character.', error);
        return false;
      })
  );

  if (!lightweightMode) {
    trackReadyTask(
      loadGltf(loader, josephRunModelPath)
        .then((gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return false;
        }
        const model = gltf.scene;
        josephRunModel = model;
        normalizeModelToHeight(model, 2);
        model.position.y -= 0.5;
        model.visible = false;
        model.traverse((object) => {
          if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        robe.add(model);

        if (gltf.animations.length) {
          runMixer = new THREE.AnimationMixer(model);
          runAction = runMixer.clipAction(gltf.animations[0]);
          runAction.play();
          runAction.paused = true;
        }
        stage.dataset.runCharacter = 'glb';
        return true;
      })
        .catch((error) => {
          console.warn('Joseph running GLB failed to load, using walking animation for run.', error);
          return false;
        })
    );

    trackReadyTask(
      loadGltf(loader, josephJumpModelPath)
        .then((gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return false;
        }
        const model = gltf.scene;
        josephJumpModel = model;
        normalizeModelToHeight(model, 2);
        model.position.y -= 0.5;
        model.visible = false;
        model.traverse((object) => {
          if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        robe.add(model);

        if (gltf.animations.length) {
          jumpMixer = new THREE.AnimationMixer(model);
          jumpAction = jumpMixer.clipAction(gltf.animations[0]);
          jumpAction.play();
          jumpAction.paused = true;
        }
        stage.dataset.jumpCharacter = 'glb';
        return true;
      })
        .catch((error) => {
          console.warn('Joseph jumping GLB failed to load, using movement animation during jump.', error);
          return false;
        })
    );
  } else {
    stage.dataset.runCharacter = 'skipped';
    stage.dataset.jumpCharacter = 'skipped';
  }

  if (!lightweightMode) {
    trackReadyTask(
      loadGltf(loader, jacobModelPath)
        .then((gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return false;
        }
        jacob.remove(jacobPlaceholder);
        disposeObject(jacobPlaceholder);

        const model = gltf.scene;
        normalizeModelToHeight(model, 2.25);
        model.position.y -= 0.5;
        applyRelaxedArmPose(model);
        model.traverse((object) => {
          if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        jacob.add(model);
        stage.dataset.jacob = 'glb';
        return true;
      })
        .catch((error) => {
          console.warn('Jacob GLB failed to load, using fallback character.', error);
          return false;
        })
    );
  } else {
    stage.dataset.jacob = 'fallback';
  }
  revealGameWhenReady();

  const starGeometry = createStarGeometry();
  const stars = starPositions.map(([x, z]) => {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffcf4a,
      emissive: 0x8a5400,
      metalness: 0.15,
      roughness: 0.35
    });
    const star = new THREE.Mesh(starGeometry, material);
    star.position.set(x, 0.72, z);
    star.rotation.x = Math.PI / 2;
    star.castShadow = true;
    scene.add(star);
    return star;
  });

  const keys = new Set();
  const controlButtons = Array.from(document.querySelectorAll('[data-control]'));
  const zoomButtons = Array.from(document.querySelectorAll('[data-zoom]'));
  const soundToggle = document.querySelector('[data-sound-toggle]');
  const controlKeyMap = {
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
    run: 'shift'
  };
  let running = false;
  let collected = 0;
  let verticalVelocity = 0;
  let isGrounded = true;
  let lastTick = performance.now();
  let josephNearJacob = false;
  let jacobResponseTimer = null;
  let animationFrame = null;
  let backgroundMusic = null;
  let starPickupAudio = null;
  let speechVoicesReady = null;
  let jacobSpeechRequestId = 0;

  const updateSoundButton = () => {
    if (!soundToggle) return;
    soundToggle.setAttribute('aria-pressed', String(state.audioMuted));
    soundToggle.setAttribute('aria-label', state.audioMuted ? 'Unmute game sound' : 'Mute game sound');
    soundToggle.setAttribute('title', state.audioMuted ? 'Unmute game sound' : 'Mute game sound');
  };

  const setGameAudioMuted = (muted) => {
    state.audioMuted = muted;
    updateSoundButton();
    if (muted) {
      jacobSpeechRequestId += 1;
      window.speechSynthesis?.cancel();
    }
    if (backgroundMusic) {
      backgroundMusic.muted = muted;
      if (muted) {
        backgroundMusic.pause();
      } else if (running) {
        backgroundMusic.play().catch(() => {});
      }
    }
  };

  const startBackgroundMusic = () => {
    if (!backgroundMusic) {
      backgroundMusic = new Audio(gameAudioPath);
      backgroundMusic.loop = true;
      backgroundMusic.preload = 'auto';
      backgroundMusic.volume = 0.52;
    }
    backgroundMusic.muted = state.audioMuted;
    if (!state.audioMuted) backgroundMusic.play().catch(() => {});
  };

  const stopBackgroundMusic = () => {
    if (!backgroundMusic) return;
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  };

  const preloadStarPickupSound = () => {
    if (starPickupAudio) return;
    starPickupAudio = new Audio(starPickupAudioPath);
    starPickupAudio.preload = 'auto';
    starPickupAudio.volume = 0.72;
    starPickupAudio.load();
  };

  const playStarChime = () => {
    if (state.audioMuted || !starPickupAudio) return;
    const sound = starPickupAudio.cloneNode();
    sound.volume = 0.72;
    sound.play().catch(() => {});
  };

  const loadSpeechVoices = () => {
    const speech = window.speechSynthesis;
    if (!speech) return Promise.resolve([]);

    const currentVoices = speech.getVoices();
    if (currentVoices.length) return Promise.resolve(currentVoices);
    if (speechVoicesReady) return speechVoicesReady;

    speechVoicesReady = new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        speech.removeEventListener?.('voiceschanged', finish);
        resolve(speech.getVoices());
      };

      speech.addEventListener?.('voiceschanged', finish, { once: true });
      setTimeout(finish, 900);
    });

    return speechVoicesReady;
  };

  const selectJacobVoice = (voices) =>
    voices.find((voice) =>
      /google uk english male|microsoft david|microsoft george|daniel|george|thomas|david|alex|male/i.test(
        `${voice.name} ${voice.voiceURI}`
      )
    );

  const setCameraDistance = (nextDistance) => {
    cameraDistance = THREE.MathUtils.clamp(nextDistance, minCameraDistance, maxCameraDistance);
    cameraOffset.z = cameraDistance;
    cameraOffset.y = THREE.MathUtils.lerp(1.05, 2.6, (cameraDistance - minCameraDistance) / (maxCameraDistance - minCameraDistance));
    stage.dataset.zoom = cameraDistance.toFixed(1);
  };

  const setJosephMode = (mode) => {
    let effectiveMode = mode;
    if (mode === 'jump' && (!josephJumpModel || !jumpAction)) {
      effectiveMode = josephRunModel && runAction ? 'run' : 'walk';
    }
    if (effectiveMode === 'run' && (!josephRunModel || !runAction)) {
      effectiveMode = 'walk';
    }
    if (effectiveMode === activeJosephMode) return;
    activeJosephMode = effectiveMode;

    if (josephWalkModel) josephWalkModel.visible = effectiveMode !== 'run' && effectiveMode !== 'jump';
    if (josephRunModel) josephRunModel.visible = effectiveMode === 'run';
    if (josephJumpModel) josephJumpModel.visible = effectiveMode === 'jump';

    if (walkAction) walkAction.paused = effectiveMode === 'run' || effectiveMode === 'jump';
    if (runAction) {
      runAction.paused = effectiveMode !== 'run';
      if (effectiveMode === 'run') runAction.time = 0;
    }
    if (jumpAction) {
      jumpAction.paused = effectiveMode !== 'jump';
      if (effectiveMode === 'jump') jumpAction.time = 0;
    }
    stage.dataset.josephMode = effectiveMode;
  };

  const holdJosephIdlePose = () => {
    setJosephMode('idle');
    if (!walkAction || !walkMixer) return;
    walkAction.paused = false;
    walkAction.time = 0;
    walkMixer.update(0);
    walkAction.paused = true;
    if (josephWalkModel) applyJosephRestArmPose(josephWalkModel);
  };

  setCameraDistance(cameraDistance);

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  };

  const onKeyDown = (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'shift'].includes(key)) {
      event.preventDefault();
    }

    if (event.code === 'Space' || key === ' ') {
      if (running && isGrounded) {
        verticalVelocity = jumpStrength;
        isGrounded = false;
      }
      return;
    }

    keys.add(key);
  };
  const onKeyUp = (event) => keys.delete(event.key.toLowerCase());
  const onControlDown = (event) => {
    event.preventDefault();
    if (event.currentTarget.dataset.control === 'jump') {
      if (running && isGrounded) {
        verticalVelocity = jumpStrength;
        isGrounded = false;
      }
      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }
    const key = controlKeyMap[event.currentTarget.dataset.control];
    if (key) keys.add(key);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onControlUp = (event) => {
    event.preventDefault();
    const key = controlKeyMap[event.currentTarget.dataset.control];
    if (key) keys.delete(key);
  };
  const onZoomClick = (event) => {
    const direction = event.currentTarget.dataset.zoom === 'in' ? -1 : 1;
    setCameraDistance(cameraDistance + direction * 1.4);
  };
  const onWheel = (event) => {
    event.preventDefault();
    setCameraDistance(cameraDistance + Math.sign(event.deltaY) * 1.1);
  };
  const onSoundToggle = () => {
    const nextMuted = !state.audioMuted;
    setGameAudioMuted(nextMuted);
    if (!nextMuted && running) startBackgroundMusic();
  };
  const requestLandscapeMode = () => {
    if (!lightweightMode) return;
    const orientation = window.screen?.orientation;
    const fullscreenRequest = gameShell?.requestFullscreen?.();
    if (fullscreenRequest?.then) {
      fullscreenRequest.then(() => {
        orientation?.lock?.('landscape').catch(() => {});
      }).catch(() => {
        orientation?.lock?.('landscape').catch(() => {});
      });
      return;
    }
    orientation?.lock?.('landscape').catch(() => {});
  };

  const updateHud = () => {
    const starsEl = document.querySelector('[data-stars]');
    const xpEl = document.querySelector('[data-xp]');
    const resultEl = document.querySelector('[data-result]');
    const resultTitleEl = document.querySelector('[data-result-title]');
    const rewardEl = document.querySelector('[data-game-reward]');
    const actionEls = document.querySelectorAll('[data-game-action]');
    const panelCloseEl = document.querySelector('[data-dismiss-game-panel]');
    const panelEl = document.querySelector('[data-game-panel]');
    if (starsEl) starsEl.textContent = String(collected);
    if (xpEl) xpEl.textContent = String(moduleXp(module));
    if (resultEl) resultEl.textContent = gameResultText(module);
    if (resultTitleEl) resultTitleEl.textContent = gamePanelTitle();
    if (rewardEl) rewardEl.textContent = gameRewardText(module);
    actionEls.forEach((actionEl) => {
      if (actionEl.disabled) return;
      actionEl.textContent = state.gameStatus === 'won' ? 'Play Again' : state.gameStatus === 'running' ? 'Restart' : 'Play';
    });
    if (panelCloseEl) panelCloseEl.textContent = state.gameStatus === 'won' ? 'Close Game' : 'Close';
    if (panelEl) {
      panelEl.dataset.status = state.gameStatus;
    }
  };

  const finish = (status) => {
    running = false;
    state.gameStatus = status;
    state.collected = collected;
    if (status === 'won') {
      stopBackgroundMusic();
      state.completed.add(module.id);
      state.gameXpAwarded.add(module.id);
      document.querySelector('[data-game-panel]')?.classList.remove('is-hidden');
    }
    updateHud();
  };

  const jacobResponseForProgress = () => {
    if (collected === 0) return 'Son, collect the stars';
    if (collected < stars.length) return 'Come on Son, few more to go';
    return 'well done son!';
  };

  const speakJacobResponse = (message) => {
    if (state.audioMuted) return;
    const speech = window.speechSynthesis;
    if (!speech || !window.SpeechSynthesisUtterance) return;

    const requestId = (jacobSpeechRequestId += 1);
    loadSpeechVoices().then((voices) => {
      if (state.audioMuted || disposed || requestId !== jacobSpeechRequestId) return;

      speech.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'en-US';
      utterance.rate = 0.76;
      utterance.pitch = 0.62;
      utterance.volume = 1;

      const preferredVoice = selectJacobVoice(voices);
      if (preferredVoice) utterance.voice = preferredVoice;
      speech.speak(utterance);
    });
  };

  const showJacobResponse = (message) => {
    const responseEl = document.querySelector('[data-jacob-response]');
    if (responseEl) {
      responseEl.textContent = message;
      responseEl.classList.add('is-visible');
      if (jacobResponseTimer) clearTimeout(jacobResponseTimer);
      jacobResponseTimer = setTimeout(() => {
        responseEl.classList.remove('is-visible');
      }, 2400);
    }

    speakJacobResponse(message);
  };

  const animate = (now) => {
    const delta = Math.min((now - lastTick) / 1000, 0.04);
    lastTick = now;
    updateBirdFlight(birdScene.flyingBirds, now);

    if (running) {
      movementDirection.set(0, 0, 0);
      if (keys.has('arrowup') || keys.has('w')) movementDirection.z -= 1;
      if (keys.has('arrowdown') || keys.has('s')) movementDirection.z += 1;
      if (keys.has('arrowleft') || keys.has('a')) movementDirection.x -= 1;
      if (keys.has('arrowright') || keys.has('d')) movementDirection.x += 1;
      const isMoving = movementDirection.lengthSq() > 0;
      const isRunning = isMoving && keys.has('shift');

      if (isMoving) {
        movementDirection.normalize();
        const currentSpeed = playerSpeed * (isRunning ? runMultiplier : 1);
        robe.position.x += movementDirection.x * delta * currentSpeed;
        robe.position.z += movementDirection.z * delta * currentSpeed;
        robe.rotation.y = Math.atan2(movementDirection.x, movementDirection.z);
      }

      if (!isGrounded) {
        setJosephMode('jump');
        if (jumpAction && jumpMixer) {
          jumpAction.paused = false;
          jumpMixer.update(delta);
        } else if (runAction && runMixer) {
          runAction.paused = false;
          runMixer.update(delta);
        }
      } else if (isMoving) {
        setJosephMode(isRunning ? 'run' : 'walk');
        if (isRunning && runAction && runMixer) {
          runAction.paused = false;
          runMixer.update(delta * 1.1);
        } else if (walkAction && walkMixer) {
          walkAction.paused = false;
          walkMixer.update(delta);
        }
      } else if (wasMoving || activeJosephMode !== 'idle') {
        holdJosephIdlePose();
      }
      wasMoving = isMoving;

      if (!isGrounded) {
        verticalVelocity -= gravity * delta;
        robe.position.y += verticalVelocity * delta;
        if (robe.position.y <= playerBaseY) {
          robe.position.y = playerBaseY;
          verticalVelocity = 0;
          isGrounded = true;
        }
      }

      const distanceFromCenter = Math.hypot(robe.position.x, robe.position.z);
      if (distanceFromCenter > arenaRadius) {
        const scale = arenaRadius / distanceFromCenter;
        robe.position.x *= scale;
        robe.position.z *= scale;
      }

      updateAnimalMotion(animalScene.movingAnimals, robe, now, delta, playerBaseY);
      updateAnimalAnimations(animalScene.animals, delta);

      stars.forEach((star) => {
        if (!star.visible) return;
        star.rotation.z += delta * 2.4;
        star.position.y = 0.72 + Math.sin(now / 300 + star.position.x) * 0.12;
        if (star.position.distanceTo(robe.position) < 0.75) {
          star.visible = false;
          collected += 1;
          state.collected = collected;
          playStarChime();
          updateHud();
          if (collected === stars.length) {
            deliveryRing.visible = true;
            deliveryBeacon.visible = true;
            updateHud();
          }
        }
      });

      const distanceToJacob = robe.position.distanceTo(jacob.position);
      if (distanceToJacob < 2.35 && !josephNearJacob) {
        josephNearJacob = true;
        showJacobResponse(jacobResponseForProgress());
      } else if (distanceToJacob > 2.65) {
        josephNearJacob = false;
      }

      if (collected === stars.length && distanceToJacob < 1.7) {
        finish('won');
      }
    } else {
      if (wasMoving) {
        holdJosephIdlePose();
        wasMoving = false;
      }
      stars.forEach((star, index) => {
        star.rotation.z += delta * (0.8 + index * 0.05);
      });
      updateAnimalMotion(animalScene.movingAnimals, robe, now, delta, playerBaseY);
      updateAnimalAnimations(animalScene.animals, delta);
    }

    deliveryRing.rotation.z += delta * 0.9;
    deliveryBeacon.position.y = 2.95 + Math.sin(now / 260) * 0.18;
    jacob.rotation.y = Math.atan2(robe.position.x - jacob.position.x, robe.position.z - jacob.position.z);
    cameraTarget.set(robe.position.x, 1.2, robe.position.z);
    cameraDesiredPosition.copy(cameraTarget).add(cameraOffset);
    camera.position.lerp(cameraDesiredPosition, 0.08);
    camera.lookAt(cameraTarget);
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(animate);
  };

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  stage.addEventListener('wheel', onWheel, { passive: false });
  controlButtons.forEach((button) => {
    button.addEventListener('pointerdown', onControlDown);
    button.addEventListener('pointerup', onControlUp);
    button.addEventListener('pointercancel', onControlUp);
    button.addEventListener('lostpointercapture', onControlUp);
  });
  zoomButtons.forEach((button) => {
    button.addEventListener('click', onZoomClick);
  });
  soundToggle?.addEventListener('click', onSoundToggle);
  updateSoundButton();
  animationFrame = requestAnimationFrame(animate);

  return {
    start() {
      requestLandscapeMode();
      collected = 0;
      running = true;
      state.gameStatus = 'running';
      state.collected = 0;
      gameShell?.classList.add('has-started');
      loadingEl?.setAttribute('aria-hidden', 'true');
      document.querySelector('[data-game-panel]')?.classList.add('is-hidden');
      document.querySelector('[data-jacob-response]')?.classList.remove('is-visible');
      josephNearJacob = false;
      robe.position.set(0, playerBaseY, 0);
      verticalVelocity = 0;
      isGrounded = true;
      wasMoving = false;
      holdJosephIdlePose();
      deliveryRing.visible = false;
      deliveryBeacon.visible = false;
      stars.forEach((star) => {
        star.visible = true;
      });
      if (!state.audioMuted) {
        preloadStarPickupSound();
        loadSpeechVoices();
        startBackgroundMusic();
      }
      updateHud();
    },
    dispose() {
      running = false;
      disposed = true;
      if (jacobResponseTimer) clearTimeout(jacobResponseTimer);
      jacobSpeechRequestId += 1;
      window.speechSynthesis?.cancel();
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      stage.removeEventListener('wheel', onWheel);
      controlButtons.forEach((button) => {
        button.removeEventListener('pointerdown', onControlDown);
        button.removeEventListener('pointerup', onControlUp);
        button.removeEventListener('pointercancel', onControlUp);
        button.removeEventListener('lostpointercapture', onControlUp);
      });
      zoomButtons.forEach((button) => {
        button.removeEventListener('click', onZoomClick);
      });
      soundToggle?.removeEventListener('click', onSoundToggle);
      stopBackgroundMusic();
      renderer.dispose();
      starGeometry.dispose();
      disposeObject(scene);
      stage.replaceChildren();
    }
  };
}

function createFallbackJoseph() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.38, 0.95, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x2f8dd8, roughness: 0.55 })
  );
  body.castShadow = true;
  group.add(body);

  const sash = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.14, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xf4be4f, roughness: 0.45 })
  );
  sash.position.set(0, 0.18, 0.34);
  group.add(sash);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0xd8a56d, roughness: 0.6 })
  );
  head.position.y = 0.88;
  head.castShadow = true;
  group.add(head);
  return group;
}

function createFallbackJacob() {
  const group = new THREE.Group();
  const robeMaterial = new THREE.MeshStandardMaterial({ color: 0xb08355, roughness: 0.78 });
  const mantleMaterial = new THREE.MeshStandardMaterial({ color: 0xf0dfbf, roughness: 0.82 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xd0a06d, roughness: 0.65 });
  const beardMaterial = new THREE.MeshStandardMaterial({ color: 0xe7dfcf, roughness: 0.9 });
  const leatherMaterial = new THREE.MeshStandardMaterial({ color: 0x5a3b25, roughness: 0.86 });

  const robe = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.48, 1.22, 8, 18),
    robeMaterial
  );
  robe.castShadow = true;
  group.add(robe);

  const mantle = new THREE.Mesh(
    new THREE.BoxGeometry(1.08, 0.22, 0.18),
    mantleMaterial
  );
  mantle.position.set(0, 0.28, 0.38);
  group.add(mantle);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 24, 24),
    skinMaterial
  );
  head.position.y = 1.08;
  head.castShadow = true;
  group.add(head);

  const beard = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.42, 16),
    beardMaterial
  );
  beard.position.set(0, 0.82, 0.25);
  beard.rotation.x = Math.PI;
  group.add(beard);

  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.95, 8), leatherMaterial);
  staff.position.set(0.64, 0.42, 0.22);
  staff.rotation.z = 0.12;
  group.add(staff);

  const handGeometry = new THREE.SphereGeometry(0.08, 10, 8);
  [
    [-0.44, 0.2, 0.34],
    [0.48, 0.23, 0.36]
  ].forEach(([x, y, z]) => {
    const hand = new THREE.Mesh(handGeometry, skinMaterial);
    hand.position.set(x, y, z);
    group.add(hand);
  });

  return group;
}

function createAnimalScene(starPositions, jacobPosition) {
  const group = new THREE.Group();
  const animals = [];
  const movingAnimals = [];
  const finalStar = new THREE.Vector3(starPositions[5][0], 0.02, starPositions[5][1]);
  const deliveryStar = new THREE.Vector3(starPositions[6][0], 0.02, starPositions[6][1]);
  const flockPlacements = [
    { center: finalStar, offset: [1.1, -0.9], range: 2.2, speed: 0.72, phase: 0.2, seed: 11, scale: 0.86 },
    { center: finalStar, offset: [2.4, 1.2], range: 2.5, speed: 0.78, phase: 1.5, seed: 17, scale: 0.9 },
    { center: finalStar, offset: [5.1, -1.5], range: 2.4, speed: 0.67, phase: 2.6, seed: 23, scale: 0.88 },
    { center: deliveryStar, offset: [0.6, 1.1], range: 2.15, speed: 0.74, phase: 3.7, seed: 29, scale: 0.84 },
    { center: new THREE.Vector3(jacobPosition.x - 1.8, 0.02, jacobPosition.z + 1.8), offset: [0, 0], range: 2.35, speed: 0.62, phase: 4.6, seed: 31, scale: 0.92 },
    { center: new THREE.Vector3(jacobPosition.x - 3.5, 0.02, jacobPosition.z + 4.1), offset: [0, 0], range: 2.1, speed: 0.76, phase: 5.4, seed: 37, scale: 0.86 }
  ];

  flockPlacements.forEach((placement) => {
    const center = placement.center.clone().add(new THREE.Vector3(placement.offset[0], 0, placement.offset[1]));
    const animal = createAnimalSlot({
      type: 'sheep',
      fallback: createSheep(),
      height: 1.08,
      position: [center.x + Math.cos(placement.phase) * placement.range * 0.45, 0.02, center.z + Math.sin(placement.phase) * placement.range * 0.45],
      rotation: placement.phase,
      scale: placement.scale,
      animated: true,
      moving: createWanderMotion({
        center,
        range: placement.range,
        speed: placement.speed,
        seed: placement.seed,
        collisionRadius: 1.25,
        pushStrength: 2.7
      })
    });
    animals.push(animal);
    movingAnimals.push(animal);
    group.add(animal.group);
  });

  const standingSheepPlacements = [
    { x: starPositions[0][0] - 1.3, z: starPositions[0][1] + 1.2, rotation: 0.9, scale: 0.9 },
    { x: starPositions[2][0] + 1.25, z: starPositions[2][1] - 1.2, rotation: -0.35, scale: 0.86 }
  ];

  standingSheepPlacements.forEach((placement, index) => {
    const animal = createAnimalSlot({
      type: 'sheep',
      fallback: createSheep({ grazing: true }),
      height: 1.04,
      position: [placement.x, 0.02, placement.z],
      rotation: placement.rotation,
      scale: placement.scale,
      animated: false,
      pose: 'grazing',
      stillFrame: index * 0.22
    });
    animals.push(animal);
    group.add(animal.group);
  });

  const camel = createAnimalSlot({
    type: 'camel',
    fallback: createCamel(),
    height: 2.75,
    position: [starPositions[3][0] + 2.4, 0.05, starPositions[3][1] - 2.2],
    rotation: -0.65,
    scale: 0.98,
    animated: true,
    moving: createWanderMotion({
      center: new THREE.Vector3(starPositions[3][0] + 2.4, 0.05, starPositions[3][1] - 2.2),
      range: 3.2,
      speed: 0.48,
      seed: 43,
      collisionRadius: 1.95,
      pushStrength: 1.9
    })
  });
  animals.push(camel);
  movingAnimals.push(camel);
  group.add(camel.group);

  [
    { x: starPositions[3][0] + 0.5, z: starPositions[3][1] - 3.4, rotation: -1.1, scale: 0.82 },
    { x: starPositions[3][0] + 4.4, z: starPositions[3][1] - 0.8, rotation: -0.2, scale: 0.88 }
  ].forEach((placement, index) => {
    const animal = createAnimalSlot({
      type: 'sheep',
      fallback: createSheep({ grazing: true }),
      height: 1.03,
      position: [placement.x, 0.02, placement.z],
      rotation: placement.rotation,
      scale: placement.scale,
      animated: false,
      pose: 'grazing',
      stillFrame: 0.35 + index * 0.18
    });
    animals.push(animal);
    group.add(animal.group);
  });

  return { group, animals, movingAnimals };
}

function createBirdScene(jacobPosition) {
  const group = new THREE.Group();
  const birds = [];
  const flyingBirds = [];
  const flightConfigs = [
    {
      type: 'heron',
      height: 0.95,
      duration: 42,
      phase: 0.03,
      bob: 0.32,
      points: [[-28, 7.5, -18], [-12, 9, -34], [14, 8.4, -30], [30, 7.2, -10], [18, 8.8, 10], [-9, 7.8, 16], [-27, 6.8, 3]]
    },
    {
      type: 'falcon',
      height: 0.78,
      duration: 31,
      phase: 0.22,
      bob: 0.45,
      points: [[-24, 11, -8], [-6, 13, -31], [22, 10.5, -24], [30, 9.2, 4], [5, 12, 19], [-22, 10, 12]]
    },
    {
      type: 'hoopoe',
      height: 0.52,
      duration: 34,
      phase: 0.41,
      bob: 0.38,
      points: [[-18, 6.2, -26], [6, 7.4, -33], [26, 6.8, -14], [20, 7.6, 12], [-5, 6.5, 18], [-26, 7.1, -1]]
    },
    {
      type: 'raven',
      height: 0.64,
      duration: 37,
      phase: 0.59,
      bob: 0.5,
      points: [[-30, 8.5, -4], [-18, 9.8, -28], [9, 8.2, -35], [28, 9.4, -15], [25, 8.1, 14], [-7, 9.2, 20], [-27, 8, 11]]
    },
    {
      type: 'dove',
      height: 0.54,
      duration: 29,
      phase: 0.76,
      bob: 0.35,
      points: [[-22, 7, -12], [-2, 8.5, -29], [24, 7.2, -20], [28, 8, 8], [2, 7.4, 21], [-25, 8.2, 7]]
    }
  ];

  flightConfigs.forEach((config) => {
    const curve = new THREE.CatmullRomCurve3(
      config.points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      true,
      'catmullrom',
      0.45
    );
    const groupPosition = curve.getPointAt(config.phase);
    const bird = createBirdSlot({
      type: config.type,
      height: config.height,
      position: groupPosition,
      fallback: createFallbackBird(config.type, false),
      flight: {
        curve,
        duration: config.duration,
        phase: config.phase,
        bob: config.bob,
        bank: 0,
        point: new THREE.Vector3(),
        tangent: new THREE.Vector3(),
        nextTangent: new THREE.Vector3()
      }
    });
    birds.push(bird);
    flyingBirds.push(bird);
    group.add(bird.group);
  });

  const perchPosition = new THREE.Vector3(jacobPosition.x + 1.7, 0, jacobPosition.z + 0.45);
  group.add(createFalconPerch(perchPosition));
  const perchedFalcon = createBirdSlot({
    type: 'falcon',
    height: 0.72,
    position: new THREE.Vector3(perchPosition.x, 1.28, perchPosition.z),
    rotation: -2.2,
    fallback: createFallbackBird('falcon', true),
    perched: true
  });
  birds.push(perchedFalcon);
  group.add(perchedFalcon.group);

  return { group, birds, flyingBirds };
}

function createBirdSlot({ type, height, position, rotation = 0, fallback, flight = null, perched = false }) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotation;
  group.add(fallback);
  return { type, height, group, fallback, flight, perched };
}

function createFalconPerch(position) {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4227, roughness: 0.94 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.25, 9), wood);
  post.position.y = 0.62;
  post.castShadow = true;
  group.add(post);

  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.72, 8), wood);
  crossbar.position.y = 1.23;
  crossbar.rotation.z = Math.PI / 2;
  crossbar.castShadow = true;
  group.add(crossbar);
  group.position.copy(position);
  return group;
}

function createFallbackBird(type, perched) {
  const group = new THREE.Group();
  const colors = {
    heron: [0xc4c7c0, 0x39404a],
    falcon: [0x8c6745, 0x3f2f25],
    hoopoe: [0xd69b55, 0x2d2927],
    raven: [0x20242b, 0x111319],
    dove: [0xd8d4c9, 0x77756e]
  };
  const [bodyColor, wingColor] = colors[type] || colors.dove;
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.82 });
  const wingMaterial = new THREE.MeshStandardMaterial({ color: wingColor, roughness: 0.86, side: THREE.DoubleSide });
  const beakMaterial = new THREE.MeshStandardMaterial({ color: 0xc59a48, roughness: 0.76 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), bodyMaterial);
  body.scale.set(0.72, 0.68, 1.5);
  body.castShadow = perched;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), bodyMaterial);
  head.position.set(0, 0.1, 0.34);
  head.castShadow = perched;
  group.add(head);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 7), beakMaterial);
  beak.position.set(0, 0.08, 0.52);
  beak.rotation.x = Math.PI / 2;
  group.add(beak);

  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.18, perched ? 0.48 : 0.9, 5), wingMaterial);
    wing.position.set(side * (perched ? 0.14 : 0.4), 0, -0.02);
    wing.rotation.z = side * (perched ? 0.18 : Math.PI / 2);
    wing.rotation.y = side * 0.08;
    wing.scale.z = 0.25;
    wing.castShadow = perched;
    group.add(wing);
  });

  return group;
}

function createAnimalSlot({ type, fallback, height, position, rotation, scale, animated, moving, pose = 'standing', stillFrame = 0 }) {
  const group = new THREE.Group();
  group.position.set(position[0], position[1], position[2]);
  group.rotation.y = rotation;
  group.scale.setScalar(scale);
  group.add(fallback);
  return {
    type,
    group,
    fallback,
    height,
    scale,
    animated,
    moving,
    pose,
    isMoving: Boolean(moving),
    mixer: null,
    action: null,
    stillFrame
  };
}

function createWanderMotion({ center, range, speed, seed, collisionRadius, pushStrength }) {
  const moving = {
    center,
    range,
    speed,
    seed,
    collisionRadius,
    pushStrength,
    target: new THREE.Vector3(),
    targetIndex: 0,
    pauseUntil: 0
  };
  chooseNextWanderTarget(moving);
  return moving;
}

function chooseNextWanderTarget(moving) {
  const angle = seededNoise(moving.targetIndex, moving.seed) * Math.PI * 2;
  const distance = moving.range * (0.35 + seededNoise(moving.targetIndex, moving.seed + 7) * 0.65);
  moving.target.set(
    moving.center.x + Math.cos(angle) * distance,
    moving.center.y,
    moving.center.z + Math.sin(angle) * distance
  );
  moving.targetIndex += 1;
}

function loadAnimalAssets(loader, animalScene, isDisposed, stage) {
  stage.dataset.animals = 'fallback';
  const requests = Object.entries(animalModelPaths).map(([type, path]) =>
    loadGltf(loader, path).then((gltf) => [type, gltf])
  );

  return Promise.allSettled(requests).then((results) => {
    const assets = Object.fromEntries(
      results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)
    );

    if (isDisposed()) {
      Object.values(assets).forEach((asset) => disposeObject(asset.scene));
      return false;
    }

    let loadedCount = 0;
    animalScene.animals.forEach((animal) => {
      const asset = assets[animal.type];
      if (!asset) return;

      animal.group.remove(animal.fallback);
      disposeObject(animal.fallback);
      const model = cloneSkinnedModel(asset.scene);
      normalizeModelToHeight(model, animal.height);
      model.position.y -= 0.02;
      model.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      animal.group.add(model);

      if (asset.animations.length) {
        animal.mixer = new THREE.AnimationMixer(model);
        animal.action = animal.mixer.clipAction(asset.animations[0]);
        animal.action.play();
        if (!animal.animated) {
          animal.mixer.setTime(animal.stillFrame);
          animal.action.paused = true;
        }
      }
      if (animal.pose === 'grazing' && animal.type === 'sheep') {
        applySheepGrazingPose(model, animal.stillFrame);
      }
      loadedCount += 1;
    });

    stage.dataset.animals = loadedCount === animalScene.animals.length ? 'glb' : loadedCount > 0 ? 'partial' : 'fallback';
    return loadedCount > 0;
  });
}

function cloneSkinnedModel(source) {
  const clone = source.clone(true);
  const sourceLookup = new Map();
  const cloneLookup = new Map();

  parallelTraverse(source, clone, (sourceNode, cloneNode) => {
    sourceLookup.set(cloneNode, sourceNode);
    cloneLookup.set(sourceNode, cloneNode);
  });

  clone.traverse((node) => {
    if (!node.isSkinnedMesh) return;
    const sourceMesh = sourceLookup.get(node);
    node.skeleton = sourceMesh.skeleton.clone();
    node.bindMatrix.copy(sourceMesh.bindMatrix);
    node.skeleton.bones = sourceMesh.skeleton.bones.map((bone) => cloneLookup.get(bone));
  });

  return clone;
}

function parallelTraverse(source, clone, callback) {
  callback(source, clone);
  for (let index = 0; index < source.children.length; index += 1) {
    parallelTraverse(source.children[index], clone.children[index], callback);
  }
}

function loadBirdAssets(loader, birdScene, isDisposed, stage) {
  stage.dataset.birds = 'fallback';
  const requests = Object.entries(birdModelPaths).map(([type, path]) =>
    loadGltf(loader, path).then((gltf) => [type, gltf.scene])
  );

  return Promise.allSettled(requests).then((results) => {
    const assets = Object.fromEntries(
      results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)
    );

    if (isDisposed()) {
      Object.values(assets).forEach(disposeObject);
      return false;
    }

    let loadedCount = 0;
    birdScene.birds.forEach((bird) => {
      const source = assets[bird.type];
      if (!source) return;

      bird.group.remove(bird.fallback);
      disposeObject(bird.fallback);
      const model = source.clone(true);
      normalizeModelToHeight(model, bird.height);
      model.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = bird.perched;
        object.receiveShadow = bird.perched;
      });
      bird.group.add(model);
      loadedCount += 1;
    });

    stage.dataset.birds = loadedCount === birdScene.birds.length ? 'glb' : loadedCount > 0 ? 'partial' : 'fallback';
    return loadedCount > 0;
  });
}

function updateBirdFlight(birds, now) {
  birds.forEach((bird) => {
    const flight = bird.flight;
    const progress = (now * 0.001 / flight.duration + flight.phase) % 1;
    const nextProgress = (progress + 0.006) % 1;
    flight.curve.getPointAt(progress, flight.point);
    flight.curve.getTangentAt(progress, flight.tangent).normalize();
    flight.curve.getTangentAt(nextProgress, flight.nextTangent).normalize();

    bird.group.position.copy(flight.point);
    bird.group.position.y += Math.sin(now * 0.0024 + flight.phase * Math.PI * 2) * flight.bob;
    bird.group.rotation.y = Math.atan2(flight.tangent.x, flight.tangent.z);
    bird.group.rotation.x = -flight.tangent.y * 0.45;
    const turn = flight.tangent.x * flight.nextTangent.z - flight.tangent.z * flight.nextTangent.x;
    flight.bank = THREE.MathUtils.lerp(flight.bank, THREE.MathUtils.clamp(turn * 9, -0.42, 0.42), 0.08);
    bird.group.rotation.z = flight.bank;
  });
}

function applySheepGrazingPose(model, variant = 0) {
  const head = model.getObjectByName('head');
  const chest = model.getObjectByName('chest');
  if (head) {
    head.rotation.x -= 0.72;
    head.rotation.z += (variant - 0.25) * 0.08;
  }
  if (chest) chest.rotation.x += 0.08;
}

function updateAnimalMotion(animals, player, now, delta, playerBaseY) {
  animals.forEach((animal) => {
    const moving = animal.moving;
    if (!moving) return;

    const targetX = moving.target.x - animal.group.position.x;
    const targetZ = moving.target.z - animal.group.position.z;
    const targetDistance = Math.hypot(targetX, targetZ);

    if (now < moving.pauseUntil) {
      animal.isMoving = false;
    } else if (targetDistance < 0.16) {
      animal.isMoving = false;
      moving.pauseUntil = now + 700 + seededNoise(moving.targetIndex, moving.seed + 13) * 1500;
      chooseNextWanderTarget(moving);
    } else {
      animal.isMoving = true;
      const step = Math.min(moving.speed * delta, targetDistance);
      const moveX = (targetX / targetDistance) * step;
      const moveZ = (targetZ / targetDistance) * step;
      animal.group.position.x += moveX;
      animal.group.position.z += moveZ;
      animal.group.rotation.y = Math.atan2(moveX, moveZ);
    }

    if (player.position.y > playerBaseY + 0.48) return;

    const dx = player.position.x - animal.group.position.x;
    const dz = player.position.z - animal.group.position.z;
    const distance = Math.hypot(dx, dz);
    const blockRadius = moving.collisionRadius;
    if (distance <= 0 || distance >= blockRadius) return;

    const push = (blockRadius - distance) * moving.pushStrength * delta;
    player.position.x += (dx / distance) * push;
    player.position.z += (dz / distance) * push;
  });
}

function updateAnimalAnimations(animals, delta) {
  animals.forEach((animal) => {
    if (!animal.animated || !animal.mixer || !animal.action) return;
    animal.action.paused = !animal.isMoving;
    if (animal.isMoving) animal.mixer.update(delta);
  });
}

function createSheep({ grazing = false } = {}) {
  const group = new THREE.Group();
  const woolMaterial = new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.85 });
  const faceMaterial = new THREE.MeshStandardMaterial({ color: 0x4f463d, roughness: 0.8 });
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x3f382f, roughness: 0.85 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.58, 18, 14), woolMaterial);
  body.scale.set(1.25, 0.78, 0.82);
  body.position.y = 0.58;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 12), faceMaterial);
  head.scale.set(0.82, 0.92, 1.08);
  head.position.set(0, grazing ? 0.31 : 0.62, grazing ? 0.68 : 0.58);
  head.rotation.x = grazing ? 0.62 : 0;
  head.castShadow = true;
  group.add(head);

  const woolCap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), woolMaterial);
  woolCap.scale.set(1.08, 0.72, 0.78);
  woolCap.position.set(0, grazing ? 0.47 : 0.83, grazing ? 0.57 : 0.47);
  woolCap.rotation.x = grazing ? 0.62 : 0;
  woolCap.castShadow = true;
  group.add(woolCap);

  const legGeometry = new THREE.CylinderGeometry(0.045, 0.055, 0.42, 8);
  [
    [-0.32, 0.24, 0.28],
    [0.32, 0.24, 0.28],
    [-0.32, 0.24, -0.28],
    [0.32, 0.24, -0.28]
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    group.add(leg);
  });

  return group;
}

function createCamel() {
  const group = new THREE.Group();
  const hideMaterial = new THREE.MeshStandardMaterial({ color: 0xc08a55, roughness: 0.82 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x6f4527, roughness: 0.85 });
  const saddleMaterial = new THREE.MeshStandardMaterial({ color: 0x315a72, roughness: 0.78 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.3, 8, 16), hideMaterial);
  body.rotation.z = Math.PI / 2;
  body.scale.set(0.92, 1.35, 0.7);
  body.position.y = 0.85;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  [-0.34, 0.32].forEach((x) => {
    const hump = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), hideMaterial);
    hump.scale.set(0.86, 1.26, 0.7);
    hump.position.set(x, 1.22, 0);
    hump.castShadow = true;
    group.add(hump);
  });

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.13, 0.86), saddleMaterial);
  saddle.position.set(0, 1.16, 0);
  saddle.rotation.x = 0.04;
  group.add(saddle);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 1.02, 10), hideMaterial);
  neck.position.set(0, 1.28, 0.77);
  neck.rotation.x = -0.55;
  neck.castShadow = true;
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 12), hideMaterial);
  head.scale.set(0.78, 0.72, 1.34);
  head.position.set(0, 1.68, 1.14);
  head.castShadow = true;
  group.add(head);

  [
    [-0.08, 1.88, 1.08],
    [0.08, 1.88, 1.08]
  ].forEach(([x, y, z]) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 8), darkMaterial);
    ear.position.set(x, y, z);
    ear.rotation.x = -0.2;
    group.add(ear);
  });

  const legGeometry = new THREE.CylinderGeometry(0.052, 0.07, 0.92, 8);
  [
    [-0.56, 0.42, 0.34],
    [0.56, 0.42, 0.34],
    [-0.56, 0.42, -0.34],
    [0.56, 0.42, -0.34]
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, darkMaterial);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    group.add(leg);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.5, 6), darkMaterial);
  tail.position.set(0, 0.82, -0.9);
  tail.rotation.x = 0.55;
  tail.castShadow = true;
  group.add(tail);

  const tailTuft = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), darkMaterial);
  tailTuft.position.set(0, 0.58, -1.1);
  group.add(tailTuft);

  return group;
}

function createGrassArenaGround(starPositions, jacobPosition) {
  const group = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(33, 34.5, 0.6, 96),
    createGrassGroundMaterial()
  );
  ground.position.y = -0.35;
  ground.receiveShadow = true;
  group.add(ground);

  const earthPatches = createEarthPatches(starPositions, jacobPosition);
  group.add(earthPatches);

  const grassTufts = createGrassTufts(starPositions, jacobPosition);
  group.add(grassTufts);

  return group;
}

function createFallbackCampDecorations() {
  const group = new THREE.Group();
  const tentPlacements = [
    { x: -27, z: -7, scale: 1.35, rotation: 0.5 },
    { x: -21, z: -10, scale: 1.05, rotation: 0.25 },
    { x: 23, z: 24, scale: 1.2, rotation: -0.75 },
    { x: -15.5, z: -6.5, scale: 1.12, rotation: 0.82 },
    { x: 19.5, z: 25.5, scale: 1.1, rotation: -0.35 },
    { x: 16.5, z: -26.5, scale: 1.16, rotation: 0.55 },
    { x: 27, z: -20.5, scale: 1.08, rotation: -1.08 }
  ];

  tentPlacements.forEach((placement) => {
    const tent = createTent(placement.scale);
    tent.position.set(placement.x, 0.02, placement.z);
    tent.rotation.y = placement.rotation;
    group.add(tent);
  });

  return group;
}

function createTent(scale = 1) {
  const group = new THREE.Group();
  const clothMaterial = new THREE.MeshStandardMaterial({ color: 0xb88955, roughness: 0.86, side: THREE.DoubleSide });
  const darkClothMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4429, roughness: 0.9, side: THREE.DoubleSide });
  const ropeMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.82 });

  const canvas = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.1, 4), clothMaterial);
  canvas.scale.set(1.35, 0.78, 0.92);
  canvas.rotation.y = Math.PI / 4;
  canvas.position.y = 0.58;
  canvas.castShadow = true;
  canvas.receiveShadow = true;
  group.add(canvas);

  const entrance = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.62), darkClothMaterial);
  entrance.position.set(0, 0.38, 0.98);
  entrance.rotation.x = -0.06;
  group.add(entrance);

  [-0.8, 0.8].forEach((x) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.15, 6), ropeMaterial);
    pole.position.set(x, 0.58, 0.86);
    pole.rotation.z = x > 0 ? -0.12 : 0.12;
    pole.castShadow = true;
    group.add(pole);
  });

  group.scale.setScalar(scale);
  return group;
}

function createGrassGroundMaterial() {
  const colorTexture = createGrassTexture(512);
  colorTexture.wrapS = THREE.RepeatWrapping;
  colorTexture.wrapT = THREE.RepeatWrapping;
  colorTexture.repeat.set(9, 9);

  const bumpTexture = createGrassBumpTexture(256);
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.RepeatWrapping;
  bumpTexture.repeat.set(12, 12);

  return new THREE.MeshStandardMaterial({
    color: 0x78934f,
    map: colorTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.075,
    roughness: 0.96,
    metalness: 0
  });
}

function createGrassTexture(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#6f8849');
  gradient.addColorStop(0.46, '#829a56');
  gradient.addColorStop(1, '#5f7741');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  for (let i = 0; i < 8500; i += 1) {
    const x = seededNoise(i, 3) * size;
    const y = seededNoise(i, 7) * size;
    const length = 2 + seededNoise(i, 11) * 8;
    const angle = seededNoise(i, 13) * Math.PI;
    const light = 58 + Math.floor(seededNoise(i, 17) * 35);
    const alpha = 0.12 + seededNoise(i, 19) * 0.18;
    context.strokeStyle = `hsla(${70 + seededNoise(i, 23) * 28}, ${28 + seededNoise(i, 29) * 28}%, ${light}%, ${alpha})`;
    context.lineWidth = 0.7 + seededNoise(i, 31) * 0.8;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    context.stroke();
  }

  for (let i = 0; i < 380; i += 1) {
    const x = seededNoise(i, 37) * size;
    const y = seededNoise(i, 41) * size;
    const radius = 5 + seededNoise(i, 43) * 22;
    const patch = context.createRadialGradient(x, y, 0, x, y, radius);
    patch.addColorStop(0, `rgba(98, 80, 47, ${0.08 + seededNoise(i, 47) * 0.1})`);
    patch.addColorStop(1, 'rgba(98, 80, 47, 0)');
    context.fillStyle = patch;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createGrassBumpTexture(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  context.fillStyle = '#7f7f7f';
  context.fillRect(0, 0, size, size);

  for (let i = 0; i < 5200; i += 1) {
    const x = seededNoise(i, 53) * size;
    const y = seededNoise(i, 59) * size;
    const length = 2 + seededNoise(i, 61) * 7;
    const angle = seededNoise(i, 67) * Math.PI;
    const shade = 88 + Math.floor(seededNoise(i, 71) * 80);
    context.strokeStyle = `rgb(${shade}, ${shade}, ${shade})`;
    context.lineWidth = 0.6;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    context.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

function createEarthPatches(starPositions, jacobPosition) {
  const group = new THREE.Group();
  const patchMaterial = new THREE.MeshStandardMaterial({
    color: 0x6a5735,
    roughness: 1,
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });
  const wornGrassMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b8f58,
    roughness: 1,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
  });

  const placements = [
    ...starPositions.map(([x, z], index) => ({
      x: x + (index % 2 === 0 ? 0.4 : -0.35),
      z: z + (index % 3 === 0 ? -0.5 : 0.35),
      radius: 1.55 + (index % 3) * 0.24,
      rotation: index * 0.58,
      material: index % 2 === 0 ? patchMaterial : wornGrassMaterial
    })),
    { x: jacobPosition.x - 0.8, z: jacobPosition.z + 0.6, radius: 2.35, rotation: 0.4, material: patchMaterial },
    { x: 0, z: 0, radius: 1.9, rotation: -0.2, material: wornGrassMaterial }
  ];

  placements.forEach((placement) => {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(placement.radius, 32), placement.material);
    patch.position.set(placement.x, -0.035, placement.z);
    patch.rotation.x = -Math.PI / 2;
    patch.rotation.z = placement.rotation;
    patch.scale.set(1.45, 0.72, 1);
    patch.receiveShadow = true;
    group.add(patch);
  });

  return group;
}

function createGrassTufts(starPositions, jacobPosition) {
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(0.22, 0.46);
  geometry.translate(0, 0.23, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x88a85c,
    alphaMap: createGrassBladeAlphaTexture(),
    alphaTest: 0.32,
    emissive: 0x263916,
    emissiveIntensity: 0.35,
    transparent: true,
    roughness: 0.9,
    side: THREE.DoubleSide,
    vertexColors: true
  });
  const count = 620;
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const color = new THREE.Color();
  let placed = 0;

  for (let i = 0; i < count * 4 && placed < count; i += 1) {
    const radius = Math.sqrt(seededNoise(i, 79)) * 31;
    const angle = seededNoise(i, 83) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (isNearProtectedPlayPoint(x, z, starPositions, jacobPosition)) continue;

    position.set(x, -0.035, z);
    quaternion.setFromEuler(new THREE.Euler(
      (seededNoise(i, 139) - 0.5) * 0.18,
      seededNoise(i, 89) * Math.PI * 2,
      (seededNoise(i, 149) - 0.5) * 0.18
    ));
    const heightScale = 0.55 + seededNoise(i, 97) * 0.62;
    const widthScale = 0.75 + seededNoise(i, 101) * 0.5;
    scale.set(widthScale, heightScale, widthScale);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(placed, matrix);
    color.setHSL(0.2 + seededNoise(i, 151) * 0.06, 0.42 + seededNoise(i, 157) * 0.18, 0.5 + seededNoise(i, 163) * 0.14);
    mesh.setColorAt(placed, color);
    placed += 1;
  }

  mesh.count = placed;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  group.add(mesh);

  const clumpGeometry = new THREE.ConeGeometry(0.055, 0.24, 5);
  const clumpMaterial = new THREE.MeshStandardMaterial({
    color: 0x6f8f48,
    emissive: 0x20320f,
    emissiveIntensity: 0.28,
    roughness: 0.96,
    vertexColors: true
  });
  const clumps = new THREE.InstancedMesh(clumpGeometry, clumpMaterial, 60);
  let clumpsPlaced = 0;

  for (let i = 0; i < 360 && clumpsPlaced < 60; i += 1) {
    const radius = 8 + seededNoise(i, 107) * 23;
    const angle = seededNoise(i, 109) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (isNearProtectedPlayPoint(x, z, starPositions, jacobPosition)) continue;

    position.set(x, 0.07, z);
    quaternion.setFromEuler(new THREE.Euler(
      (seededNoise(i, 167) - 0.5) * 0.2,
      seededNoise(i, 113) * Math.PI * 2,
      (seededNoise(i, 173) - 0.5) * 0.2
    ));
    const clumpScale = 0.55 + seededNoise(i, 127) * 0.45;
    scale.set(clumpScale, 0.55 + seededNoise(i, 131) * 0.38, clumpScale);
    matrix.compose(position, quaternion, scale);
    clumps.setMatrixAt(clumpsPlaced, matrix);
    color.setHSL(0.19 + seededNoise(i, 179) * 0.05, 0.38 + seededNoise(i, 181) * 0.16, 0.44 + seededNoise(i, 191) * 0.12);
    clumps.setColorAt(clumpsPlaced, color);
    clumpsPlaced += 1;
  }

  clumps.count = clumpsPlaced;
  if (clumps.instanceColor) clumps.instanceColor.needsUpdate = true;
  clumps.castShadow = false;
  clumps.receiveShadow = false;
  group.add(clumps);

  return group;
}

function createGrassBladeAlphaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'white';
  context.lineCap = 'round';

  const blades = [
    [32, 124, 30, 58, 22, 9, 7],
    [30, 124, 21, 70, 15, 24, 5],
    [34, 124, 45, 76, 48, 28, 5],
    [31, 124, 37, 82, 39, 36, 4]
  ];

  blades.forEach(([x0, y0, x1, y1, x2, y2, width]) => {
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(x0, y0);
    context.quadraticCurveTo(x1, y1, x2, y2);
    context.stroke();
  });

  return new THREE.CanvasTexture(canvas);
}

function isNearProtectedPlayPoint(x, z, starPositions, jacobPosition) {
  const protectedPoints = [
    [0, 0, 2.2],
    [jacobPosition.x, jacobPosition.z, 2.9],
    ...starPositions.map(([starX, starZ]) => [starX, starZ, 1.9])
  ];

  return protectedPoints.some(([pointX, pointZ, radius]) => Math.hypot(x - pointX, z - pointZ) < radius);
}

function seededNoise(index, salt) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function createTwilightSky() {
  const geometry = new THREE.SphereGeometry(95, 32, 16);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x111a35) },
      midColor: { value: new THREE.Color(0x4d3558) },
      horizonColor: { value: new THREE.Color(0xd28a5a) }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 horizonColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float upper = smoothstep(0.05, 0.95, h);
        float lower = smoothstep(-0.18, 0.22, h);
        vec3 sunset = mix(horizonColor, midColor, lower);
        vec3 sky = mix(sunset, topColor, upper);
        gl_FragColor = vec4(sky, 1.0);
      }
    `
  });
  return new THREE.Mesh(geometry, material);
}

function loadEnvironmentAssets(loader, scene, fallbackEnvironment, isDisposed, stage, includePalms = true) {
  stage.dataset.environment = 'fallback';

  const environmentEntries = Object.entries(environmentModelPaths).filter(([key]) => includePalms || key !== 'palm');
  const requests = environmentEntries.map(
    ([key, path]) =>
      new Promise((resolve, reject) => {
        loader.load(
          path,
          (gltf) => resolve([key, gltf.scene]),
          undefined,
          reject
        );
      })
  );

  return Promise.allSettled(requests).then((results) => {
    const assets = Object.fromEntries(
      results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)
    );

    if (isDisposed()) {
      Object.values(assets).forEach(disposeObject);
      return false;
    }

    const requiredAssets = ['mountain', 'tree', 'rock', 'shrub', 'smallTent', 'bigTent'];
    if (includePalms) requiredAssets.push('palm');
    if (requiredAssets.some((key) => !assets[key])) {
      console.warn('Some environment GLBs failed to load, keeping fallback scenery.');
      Object.values(assets).forEach(disposeObject);
      stage.dataset.environment = 'partial';
      return false;
    }

    const environment = createTexturedEnvironment(assets);
    scene.remove(fallbackEnvironment);
    disposeObject(fallbackEnvironment);
    scene.add(environment);
    stage.dataset.environment = 'glb';
    return true;
  });
}

function createTexturedEnvironment(assets) {
  const group = new THREE.Group();

  addEnvironmentInstances(group, assets.mountain, [
    { x: -36, z: -42, height: 18, rotation: 0.1 },
    { x: -14, z: -48, height: 15, rotation: 0.7 },
    { x: 12, z: -47, height: 17, rotation: -0.4 },
    { x: 37, z: -40, height: 19, rotation: 0.45 },
    { x: -47, z: 10, height: 13, rotation: -0.8 },
    { x: 47, z: 8, height: 14, rotation: 0.9 }
  ]);

  addEnvironmentInstances(group, assets.tree, [
    { x: -25, z: -18, height: 8.5, rotation: 0.2 },
    { x: -28, z: -2, height: 7.8, rotation: 1.4 },
    { x: -22, z: 18, height: 8.2, rotation: -0.6 },
    { x: -5, z: 27, height: 7.4, rotation: 0.8 },
    { x: 15, z: 24, height: 8, rotation: -1 },
    { x: 27, z: 10, height: 7.6, rotation: 0.3 },
    { x: 29, z: -12, height: 8.4, rotation: 1.1 },
    { x: 9, z: -29, height: 7.2, rotation: -0.2 },
    { x: -31, z: -27, height: 9.1, rotation: -1.2 },
    { x: -18, z: -30, height: 6.9, rotation: 0.55 },
    { x: -33, z: 12, height: 8.8, rotation: 2.1 },
    { x: -18, z: 29, height: 6.6, rotation: -2.4 },
    { x: 2, z: 31, height: 7.1, rotation: 1.9 },
    { x: 27, z: 24, height: 8.7, rotation: -0.55 },
    { x: 34, z: 2, height: 7.3, rotation: 2.7 },
    { x: 30, z: -25, height: 9.3, rotation: 0.45 },
    { x: 18, z: -31, height: 6.8, rotation: -1.65 },
    { x: -7, z: -33, height: 7.7, rotation: 2.45 },
    { x: -31, z: -10, height: 6.7, rotation: -0.1 },
    { x: 33, z: 16, height: 7.9, rotation: 1.25 },
    { x: 21, z: -18, height: 6.4, rotation: -2.05 }
  ]);

  addEnvironmentInstances(group, assets.rock, [
    { x: -16, z: 10, height: 1.7, rotation: 0.3 },
    { x: 18, z: 3, height: 1.4, rotation: -0.9 },
    { x: -22, z: -22, height: 2.1, rotation: 1.2 },
    { x: 23, z: -23, height: 1.8, rotation: -0.4 },
    { x: 1, z: 27, height: 1.5, rotation: 0.7 }
  ]);

  addEnvironmentInstances(group, assets.shrub, [
    { x: -11, z: 18, height: 1.4, rotation: 0.1 },
    { x: 12, z: 16, height: 1.25, rotation: 1.6 },
    { x: -25, z: 4, height: 1.55, rotation: -0.7 },
    { x: 24, z: -5, height: 1.35, rotation: 0.9 },
    { x: -7, z: -25, height: 1.45, rotation: -1.4 },
    { x: 15, z: -19, height: 1.25, rotation: 0.4 }
  ]);

  if (assets.palm) {
    addEnvironmentInstances(group, assets.palm, [
      { x: -25, z: -25, height: 6.4, rotation: 0.2 },
      { x: -15, z: -29, height: 5.7, rotation: -0.65 },
      { x: -29, z: -13, height: 6.1, rotation: 1.1 },
      { x: -28, z: 7, height: 5.4, rotation: -1.4 },
      { x: -24, z: 23, height: 6.7, rotation: 2.2 },
      { x: -8, z: 29, height: 5.8, rotation: -2.6 },
      { x: 10, z: 29, height: 6.3, rotation: 0.9 },
      { x: 26, z: 20, height: 5.6, rotation: -0.2 },
      { x: 29, z: 5, height: 6.6, rotation: 1.8 },
      { x: 28, z: -12, height: 5.9, rotation: -1.05 },
      { x: 25.5, z: -27.5, height: 6.8, rotation: 0.45 },
      { x: 15.5, z: -30, height: 5.5, rotation: -2.1 }
    ]);
  }

  addEnvironmentInstances(group, assets.smallTent, [
    { x: -25.5, z: -7, height: 2.35, rotation: 0.45 },
    { x: -20.5, z: -11, height: 2.15, rotation: 0.2 },
    { x: 24.5, z: 21.5, height: 2.4, rotation: -0.7 },
    { x: -15.5, z: -6.5, height: 2.25, rotation: 0.82 },
    { x: 19.5, z: 25.5, height: 2.2, rotation: -0.35 },
    { x: 16.5, z: -26.5, height: 2.3, rotation: 0.55 },
    { x: 27, z: -20.5, height: 2.15, rotation: -1.08 }
  ]);

  addEnvironmentInstances(group, assets.bigTent, [
    { x: 22.5, z: -27.5, height: 4.35, rotation: -0.68 }
  ]);

  return group;
}

function addEnvironmentInstances(group, source, placements) {
  const prototype = source.clone(true);
  normalizeModelToHeight(prototype, 1);
  prototype.updateMatrixWorld(true);

  prototype.traverse((object) => {
    if (!object.isMesh) return;
    const instances = new THREE.InstancedMesh(object.geometry, object.material, placements.length);
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const placementMatrix = new THREE.Matrix4();
    const instanceMatrix = new THREE.Matrix4();

    placements.forEach((placement, index) => {
      position.set(placement.x, 0, placement.z);
      rotation.setFromEuler(new THREE.Euler(0, placement.rotation, 0));
      scale.setScalar(placement.height);
      placementMatrix.compose(position, rotation, scale);
      instanceMatrix.multiplyMatrices(placementMatrix, object.matrixWorld);
      instances.setMatrixAt(index, instanceMatrix);
    });

    instances.instanceMatrix.needsUpdate = true;
    instances.castShadow = true;
    instances.receiveShadow = true;
    instances.computeBoundingSphere();
    group.add(instances);
  });
}

function applyRelaxedArmPose(model) {
  const alignBoneToDirection = (boneName, childName, targetDirection) => {
    const bone = model.getObjectByName(boneName);
    const child = model.getObjectByName(childName);
    if (!bone || !child || !bone.parent) return;

    model.updateMatrixWorld(true);
    const bonePosition = new THREE.Vector3();
    const childPosition = new THREE.Vector3();
    bone.getWorldPosition(bonePosition);
    child.getWorldPosition(childPosition);

    const currentDirection = childPosition.sub(bonePosition).normalize();
    const correction = new THREE.Quaternion().setFromUnitVectors(currentDirection, targetDirection.clone().normalize());
    const targetWorldRotation = new THREE.Quaternion();
    bone.getWorldQuaternion(targetWorldRotation);
    targetWorldRotation.premultiply(correction);

    const parentWorldRotation = new THREE.Quaternion();
    bone.parent.getWorldQuaternion(parentWorldRotation);
    bone.quaternion.copy(parentWorldRotation.invert().multiply(targetWorldRotation));
  };

  ['Left', 'Right'].forEach((side) => {
    const sideOffset = side === 'Left' ? 0.07 : -0.07;
    alignBoneToDirection(`${side}Shoulder`, `${side}Arm`, new THREE.Vector3(sideOffset, -1, 0.02));
    alignBoneToDirection(`${side}Arm`, `${side}ForeArm`, new THREE.Vector3(sideOffset * 0.5, -1, 0.08));
    alignBoneToDirection(`${side}ForeArm`, `${side}Hand`, new THREE.Vector3(0, -1, 0.05));
  });

  model.updateMatrixWorld(true);
}

function applyJosephRestArmPose(model) {
  const adjustments = [
    ['LeftShoulder', { z: 0.02 }],
    ['LeftArm', { z: 0.14, x: -0.02 }],
    ['LeftForeArm', { z: 0.01 }],
    ['RightShoulder', { z: -0.02 }],
    ['RightArm', { z: -0.14, x: -0.02 }],
    ['RightForeArm', { z: -0.01 }]
  ];

  adjustments.forEach(([name, rotation]) => {
    const bone = model.getObjectByName(name);
    if (!bone) return;
    if (!bone.userData.restBaseRotation) {
      bone.userData.restBaseRotation = {
        x: bone.rotation.x,
        y: bone.rotation.y,
        z: bone.rotation.z
      };
    }

    const base = bone.userData.restBaseRotation;
    bone.rotation.set(
      base.x + (rotation.x || 0),
      base.y + (rotation.y || 0),
      base.z + (rotation.z || 0)
    );
  });
}

function createFallbackEnvironment() {
  const group = new THREE.Group();
  group.add(createMountainRange());
  group.add(createTreeCluster());
  group.add(createFallbackCampDecorations());
  return group;
}

function createMountainRange() {
  const group = new THREE.Group();
  const ridgeMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x9a7650, roughness: 0.96 }),
    new THREE.MeshStandardMaterial({ color: 0xc09a68, roughness: 0.94 }),
    new THREE.MeshStandardMaterial({ color: 0x6e6f62, roughness: 0.98 })
  ];
  const positions = [
    [-28, -30, 9.2, 5.8, 0.2],
    [-15, -34, 10.8, 7.4, -0.25],
    [-2, -36, 12.4, 8.5, 0.1],
    [13, -34, 10.2, 6.9, 0.38],
    [27, -29, 8.8, 5.9, -0.18],
    [-35, 4, 7.2, 4.6, 0.6],
    [35, 2, 7.8, 5.1, -0.55]
  ];

  positions.forEach(([x, z, width, height, rotation], index) => {
    const ridge = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 0),
      ridgeMaterials[index % ridgeMaterials.length]
    );
    base.scale.set(width, height * 0.36, width * 0.42);
    base.position.y = height * 0.22;
    base.rotation.set(0.08, rotation, -0.04);
    base.castShadow = true;
    base.receiveShadow = true;
    ridge.add(base);

    const shoulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1, 0),
      ridgeMaterials[(index + 1) % ridgeMaterials.length]
    );
    shoulder.scale.set(width * 0.52, height * 0.24, width * 0.26);
    shoulder.position.set(width * 0.18, height * 0.48, -width * 0.04);
    shoulder.rotation.set(-0.12, rotation + 0.45, 0.18);
    shoulder.castShadow = true;
    shoulder.receiveShadow = true;
    ridge.add(shoulder);

    const face = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.52, 0.08, width * 0.18),
      new THREE.MeshStandardMaterial({ color: 0xd1b07c, roughness: 0.9 })
    );
    face.position.set(width * -0.08, height * 0.52, width * 0.18);
    face.rotation.set(0.26, rotation - 0.2, -0.08);
    ridge.add(face);

    ridge.position.set(x, -0.18, z);
    ridge.rotation.y = rotation;
    group.add(ridge);
  });

  return group;
}

function createTreeCluster() {
  const group = new THREE.Group();
  const trunkGeometry = new THREE.CylinderGeometry(0.14, 0.2, 0.85, 8);
  const canopyGeometry = new THREE.ConeGeometry(0.68, 1.55, 9);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5b3d2b, roughness: 0.85 });
  const canopyMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x2f5c3c, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x406b43, roughness: 0.82 }),
    new THREE.MeshStandardMaterial({ color: 0x284b38, roughness: 0.84 })
  ];
  const trees = [
    [-17.5, -12.5, 1.05],
    [-18.8, -4.8, 0.92],
    [-16.6, 7.2, 1.12],
    [-11.8, 14.6, 0.95],
    [-3.8, 17.2, 1.04],
    [7.2, 15.8, 0.9],
    [16.5, 9.4, 1.08],
    [18.3, -3.6, 0.98],
    [15.6, -13.4, 1.14],
    [6.8, -18.2, 0.9],
    [-7.2, -18.6, 1.02],
    [-13.8, 2.8, 0.86]
  ];

  trees.forEach(([x, z, scale], index) => {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.08;
    trunk.castShadow = true;
    tree.add(trunk);

    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterials[index % canopyMaterials.length]);
    canopy.position.y = 0.94;
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    tree.add(canopy);

    tree.position.set(x, 0.02, z);
    tree.scale.setScalar(scale);
    tree.rotation.y = index * 0.37;
    group.add(tree);
  });

  return group;
}

function normalizeModelToHeight(model, targetHeight) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = size.y > 0 ? targetHeight / size.y : 1;
  model.scale.setScalar(scale);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const center = scaledBox.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= scaledBox.min.y;
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value?.isTexture) value.dispose();
        });
        material.dispose();
      });
    }
  });
}

function createStarGeometry() {
  const shape = new THREE.Shape();
  const points = 10;
  for (let i = 0; i <= points; i += 1) {
    const radius = i % 2 === 0 ? 0.42 : 0.18;
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02 });
}

render();
