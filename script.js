const content = document.getElementById("content");
const music = document.getElementById("bg-music");

let musicStarted = false;

// 
// show site after startup screen
setTimeout(() => {
  if (content) content.classList.remove("hidden");
}, 6000);

// ======================
// BACKGROUND MUSIC (site)
// ======================
function startMusic() {
  if (!music || musicStarted) return;

  music.volume = 0.7; // adjust if you want
  music.play()
    .then(() => { musicStarted = true; })
    .catch(() => {});
}

// Start music on FIRST interaction anywhere (startup click counts)
window.addEventListener("pointerdown", startMusic, { once: true });
window.addEventListener("keydown", startMusic, { once: true });
window.addEventListener("touchstart", startMusic, { once: true });

// ======================
// WIN OVERLAY SAFETY
// ======================
window.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("winOverlay");
  const vid = document.getElementById("winVideo");
  if (overlay) overlay.classList.add("hidden");
  if (vid) {
    vid.pause();
    vid.currentTime = 0;
  }
});

// ======================
// HANGMAN'S GAMBIT GAME
// ======================
(() => {
  const ARENA = document.getElementById("gambitArena");
  const SLOT_ROW = document.getElementById("slotRow");
  const MISSES_EL = document.getElementById("gambitMisses");
  const RESTART = document.getElementById("gambitRestart");
  const LEFT_EL = document.getElementById("lettersLeft");
  const START_BTN = document.getElementById("gambitStart");

  const WIN_OVERLAY = document.getElementById("winOverlay");
  const WIN_VIDEO = document.getElementById("winVideo");

  if (!ARENA || !SLOT_ROW || !MISSES_EL || !RESTART || !LEFT_EL || !START_BTN) return;

  const TARGET = "EIGHTEEN";
  const MAX_MISSES = 5;

  let slots = [];
  let nextIndex = 0;
  let misses = 0;
  let spawnTimer = null;
  let gameRunning = false;

  // Always hide overlay initially
  if (WIN_OVERLAY) WIN_OVERLAY.classList.add("hidden");
  if (WIN_VIDEO) {
    WIN_VIDEO.pause();
    WIN_VIDEO.currentTime = 0;
  }

  // Click overlay to close (never stuck)
  if (WIN_OVERLAY) {
    WIN_OVERLAY.addEventListener("click", async () => {
      try { if (WIN_VIDEO) WIN_VIDEO.pause(); } catch(e) {}
      if (WIN_VIDEO) WIN_VIDEO.currentTime = 0;

      WIN_OVERLAY.classList.add("hidden");
      try { await document.exitFullscreen(); } catch(e) {}

      // Resume site music on this click (browser allows it)
      if (music && musicStarted) {
        music.play().catch(() => {});
      }
    });
  async function playWinVideoFullscreen() {
  if (!WIN_OVERLAY || !WIN_VIDEO) return;

  // Pause background music while video plays
  if (music && musicStarted && !music.paused) music.pause();

  // Show overlay
  WIN_OVERLAY.classList.remove("hidden");

  // Fullscreen the overlay
  try { await WIN_OVERLAY.requestFullscreen(); } catch(e) {}

  // Click anywhere to exit fullscreen and resume music
  WIN_OVERLAY.addEventListener("click", async () => {
    try { await document.exitFullscreen(); } catch(e) {}
    WIN_OVERLAY.classList.add("hidden");

    // Resume site music
    if (music && musicStarted) music.play().catch(() => {});
  }, { once: true });
}


  function buildSlots() {
    SLOT_ROW.innerHTML = "";
    slots = TARGET.split("").map(() => {
      const slot = document.createElement("div");
      slot.className = "slot";
      SLOT_ROW.appendChild(slot);
      return slot;
    });
  }

  function updateUI() {
    MISSES_EL.textContent = String(misses);
    LEFT_EL.textContent = String(Math.max(0, TARGET.length - nextIndex));
  }

  function clearLetters() {
    ARENA.querySelectorAll(".gambit-letter").forEach(el => el.remove());
  }

  function stop() {
    if (spawnTimer) clearInterval(spawnTimer);
    spawnTimer = null;
    gameRunning = false;
  }

  function start() {
    if (gameRunning) return;
    gameRunning = true;
    START_BTN.classList.add("hidden");
    spawnTimer = setInterval(spawnLetter, 650);
  }

  function reset(showStart = true) {
    stop();
    clearLetters();
    nextIndex = 0;
    misses = 0;
    buildSlots();
    updateUI();

    // Always go back to normal mode on reset
    document.body.classList.remove("trial-mode");

    if (showStart) {
      START_BTN.classList.remove("hidden");
    } else {
      start();
    }
  }

  function win() {
    stop();

    // back to normal mode
    document.body.classList.remove("trial-mode");

    playWinVideoFullscreen();

    SLOT_ROW.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }],
      { duration: 500 }
    );

    START_BTN.textContent = "PLAY AGAIN!";
    START_BTN.classList.remove("hidden");
  }

  function lose() {
    stop();

    document.body.classList.remove("trial-mode");

    SLOT_ROW.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "translateX(0)" }],
      { duration: 300 }
    );

    START_BTN.textContent = "TRY AGAIN!";
    START_BTN.classList.remove("hidden");
  }

  function spawnLetter() {
    if (!gameRunning) return;
    if (nextIndex >= TARGET.length) return;

    const needed = TARGET[nextIndex];
    const letter = Math.random() < 0.7 ? needed : String.fromCharCode(65 + Math.floor(Math.random() * 26));

    const tile = document.createElement("div");
    tile.className = "gambit-letter";
    tile.textContent = letter;

    const rect = ARENA.getBoundingClientRect();
    tile.style.left = `${Math.random() * (rect.width - 70) + 10}px`;

    let y = -60;
    const speed = 1.2 + Math.random() * 2.2;
    let alive = true;

    function tick() {
      if (!alive) return;
      y += speed;
      tile.style.top = `${y}px`;

      if (y > rect.height + 80) {
        alive = false;
        tile.remove();
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    tile.addEventListener("click", () => {
      if (!alive || !gameRunning) return;
      alive = false;

      const slot = slots[nextIndex];
      const slotRect = slot.getBoundingClientRect();
      const tileRect = tile.getBoundingClientRect();

      const dx = (slotRect.left + slotRect.width / 2) - (tileRect.left + tileRect.width / 2);
      const dy = (slotRect.top + slotRect.height / 2) - (tileRect.top + tileRect.height / 2);

      tile.animate(
        [{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${dx}px, ${dy}px) scale(0.9)` }],
        { duration: 220, easing: "ease-in" }
      ).onfinish = () => {
        tile.remove();

        if (letter === needed) {
          slot.textContent = needed;
          nextIndex++;
          updateUI();
          if (nextIndex >= TARGET.length) win();
        } else {
          misses++;
          updateUI();
          if (misses >= MAX_MISSES) lose();
        }
      };
    });

    ARENA.appendChild(tile);
  }

  START_BTN.addEventListener("click", () => {
    // helps browsers allow audio
    startMusic();

    // trial mode only during game
    document.body.classList.add("trial-mode");

    START_BTN.textContent = "START!";
    start();
  });

  RESTART.addEventListener("click", () => reset(true));

  reset(true);
})();

// ======================
// DR BLOOD SPLATTER LOOP
// ======================
(() => {
  const layer = document.getElementById("blood-layer");
  if (!layer) return;

  const BLOOD_IMAGES = ["1.png", "2.png"];

  function spawnBlood() {
    const img = document.createElement("img");
    img.className = "blood";
    img.src = BLOOD_IMAGES[Math.floor(Math.random() * BLOOD_IMAGES.length)];

    const size = Math.random() * 220 + 120; // 120..340
    img.style.width = `${size}px`;

    img.style.left = `${Math.random() * 100}%`;
    img.style.top = `${Math.random() * 100}%`;

    img.style.transform = `rotate(${Math.random() * 360}deg)`;
    img.style.opacity = "0";

    layer.appendChild(img);

    // fade in
    requestAnimationFrame(() => {
      img.style.transition = "opacity 600ms ease";
      img.style.opacity = "1";
    });

    // stay, then fade out + remove
    const stayMs = 2500 + Math.random() * 2500;
    setTimeout(() => {
      img.style.transition = "opacity 900ms ease";
      img.style.opacity = "0";
      setTimeout(() => img.remove(), 950);
    }, stayMs);
  }

  // start with a few
  for (let i = 0; i < 6; i++) spawnBlood();

  // keep spawning forever
  (function loop(){
  spawnBlood();
  setTimeout(loop, 300 + Math.random() * 700);
})();})();
