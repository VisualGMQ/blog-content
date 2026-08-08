(async () => {
  const COLS = 15, ROWS = 12, CELL = 28, GAP = 2;
  const W = COLS * (CELL + GAP) + GAP;
  const H = ROWS * (CELL + GAP) + GAP;

  const OBSTACLE_SET = new Set([
    '2,3','2,4','2,5','2,6','2,7','2,8','2,9','2,10',
    '6,1','6,2','6,3','6,4','6,11','6,12','6,13','6,14',
    '10,5','10,6','10,7','10,8','10,9','10,10',
    '3,8','4,8','5,8',
    '4,1','4,13','8,3','8,14','9,5',
  ]);

  function cellPos(r, c) {
    return { x: GAP + c * (CELL + GAP), y: GAP + r * (CELL + GAP) };
  }
  function cellCenter(r, c) {
    const p = cellPos(r, c);
    return { x: p.x + CELL / 2, y: p.y + CELL / 2 };
  }

  let grid = [];
  let queue = [];
  let startR = -1, startC = -1;
  let endR = -1, endC = -1;
  let bfsDone = false;
  let history = [];
  let pathSet = new Set();

  function initGrid() {
    grid = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => ({
        obstacle: OBSTACLE_SET.has(`${r},${c}`),
        visited: false,
        pr: -1,
        pc: -1,
      }))
    );
  }

  function resetBFS() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        grid[r][c].visited = false;
        grid[r][c].pr = -1;
        grid[r][c].pc = -1;
      }
    }
    queue = [];
    startR = -1;
    startC = -1;
    endR = -1;
    endC = -1;
    bfsDone = false;
    history = [];
    pathSet.clear();
  }

  function snapshot() {
    return {
      queue: queue.map(item => ({ r: item.r, c: item.c })),
      grid: grid.map(row => row.map(cell => ({
        obstacle: cell.obstacle,
        visited: cell.visited,
        pr: cell.pr,
        pc: cell.pc,
      }))),
      startR,
      startC,
      endR,
      endC,
      bfsDone,
      pathSet: new Set(pathSet),
    };
  }

  function restore(snap) {
    queue = snap.queue;
    grid = snap.grid;
    startR = snap.startR;
    startC = snap.startC;
    endR = snap.endR;
    endC = snap.endC;
    bfsDone = snap.bfsDone;
    pathSet = snap.pathSet;
  }

  function rebuildPath() {
    pathSet.clear();
    if (endR < 0 || endC < 0) return;
    if (!grid[endR][endC].visited || grid[endR][endC].obstacle) return;
    let r = endR, c = endC;
    while (r >= 0 && c >= 0) {
      pathSet.add(`${r},${c}`);
      const cell = grid[r][c];
      if (cell.pr < 0) break;
      r = cell.pr;
      c = cell.pc;
    }
  }

  function setStart(r, c) {
    stopAutoPlay();
    resetBFS();
    startR = r;
    startC = c;
    grid[r][c].visited = true;
    queue.push({ r, c });
    render();
  }

  function doBfsStep() {
    if (queue.length === 0) {
      bfsDone = true;
      return;
    }
    const { r, c } = queue.shift();
    const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const cell = grid[nr][nc];
      if (cell.visited || cell.obstacle) continue;
      cell.visited = true;
      cell.pr = r;
      cell.pc = c;
      queue.push({ r: nr, c: nc });
    }
    if (queue.length === 0) bfsDone = true;
  }

  function bfsStep() {
    stopAutoPlay();
    if (queue.length === 0) {
      bfsDone = true;
      render();
      return;
    }
    history.push(snapshot());
    doBfsStep();
    rebuildPath();
    render();
  }

  let autoPlaying = false, autoPlayTimer = null;

  function autoStep() {
    if (!autoPlaying || queue.length === 0) {
      stopAutoPlay();
      return;
    }
    history.push(snapshot());
    doBfsStep();
    rebuildPath();
    render();
    autoPlayTimer = setTimeout(autoStep, 200);
  }

  function play() {
    if (autoPlaying) {
      stopAutoPlay();
      return;
    }
    if (queue.length === 0) return;
    autoPlaying = true;
    autoStep();
    render();
  }

  function stopAutoPlay() {
    autoPlaying = false;
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
      autoPlayTimer = null;
    }
    render();
  }

  function prevStep() {
    stopAutoPlay();
    if (history.length === 0) return;
    restore(history.pop());
    render();
  }

  function finish() {
    stopAutoPlay();
    if (queue.length === 0) return;
    history.push(snapshot());
    while (queue.length > 0) {
      const { r, c } = queue.shift();
      const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const cell = grid[nr][nc];
        if (cell.visited || cell.obstacle) continue;
        cell.visited = true;
        cell.pr = r;
        cell.pc = c;
        queue.push({ r: nr, c: nc });
      }
    }
    bfsDone = true;
    rebuildPath();
    render();
  }

  function setEndPoint(r, c) {
    stopAutoPlay();
    if (grid[r][c].obstacle) return;
    endR = r;
    endC = c;
    rebuildPath();
    render();
  }

  function toggleObstacle(r, c) {
    stopAutoPlay();
    resetBFS();
    grid[r][c].obstacle = !grid[r][c].obstacle;
    render();
  }

  function getCell(gx, gy) {
    const c = Math.floor((gx - GAP) / (CELL + GAP));
    const r = Math.floor((gy - GAP) / (CELL + GAP));
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) return { r, c };
    return null;
  }

  const app = new PIXI.Application();
  await app.init({
    width: W,
    height: H,
    backgroundColor: 0xffffff,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  const container = document.getElementById('pixi-bfs-demo');
  container.appendChild(app.canvas);

  const gridGfx = new PIXI.Graphics();
  const arrowGfx = new PIXI.Graphics();
  const btnLayer = new PIXI.Container();
  app.stage.addChild(gridGfx, arrowGfx, btnLayer);

  app.stage.eventMode = 'static';
  app.stage.hitArea = new PIXI.Rectangle(0, 0, W, H);

  let buttonRects = [];

  function drawArrow(r, c, pr, pc) {
    const c1 = cellCenter(r, c);
    const c2 = cellCenter(pr, pc);
    const dx = c2.x - c1.x, dy = c2.y - c1.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d === 0) return;
    const len = 10;
    const ux = dx / d, uy = dy / d;

    arrowGfx.moveTo(c1.x, c1.y);
    arrowGfx.lineTo(c1.x + ux * len, c1.y + uy * len);
    arrowGfx.stroke({ width: 2, color: 0xffffff });
    arrowGfx.circle(c1.x + ux * len, c1.y + uy * len, 2.5);
    arrowGfx.fill(0xffffff);
  }

  function drawButton(x, y, w, h, label, color, onClick) {
    buttonRects.push({ x, y, w, h });

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, w, h, 6).fill(color);

    const txt = new PIXI.Text({
      text: label,
      style: { fontSize: 13, fill: 0xffffff, fontFamily: 'sans-serif' },
    });
    txt.x = w / 2 - txt.width / 2;
    txt.y = h / 2 - txt.height / 2;

    const btn = new PIXI.Container();
    btn.addChild(bg, txt);
    btn.x = x;
    btn.y = y;
    btn.eventMode = 'static';
    btn.hitArea = new PIXI.Rectangle(0, 0, w, h);
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e) => {
      e.stopPropagation();
      onClick();
    });
    btnLayer.addChild(btn);
  }

  function render() {
    gridGfx.clear();
    arrowGfx.clear();
    btnLayer.removeChildren();
    buttonRects = [];

    const front = queue.length > 0 ? queue[0] : null;
    const previewSet = new Set();
    if (front) {
      const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
      for (const [dr, dc] of dirs) {
        const nr = front.r + dr, nc = front.c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          if (!grid[nr][nc].visited && !grid[nr][nc].obstacle) {
            previewSet.add(`${nr},${nc}`);
          }
        }
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const { x, y } = cellPos(r, c);
        const cell = grid[r][c];

        let color;
        if (r === startR && c === startC) {
          color = 0x2e7d32;
        } else if (pathSet.has(`${r},${c}`)) {
          color = 0x43a047;
        } else if (r === endR && c === endC) {
          color = 0xff7043;
        } else if (front && r === front.r && c === front.c) {
          color = 0xffc107;
        } else if (previewSet.has(`${r},${c}`)) {
          color = 0x1565c0;
        } else if (cell.visited && !cell.obstacle) {
          color = 0x42a5f5;
        } else if (cell.obstacle) {
          color = 0x555555;
        } else {
          color = 0xd0d0d0;
        }

        gridGfx.rect(x, y, CELL, CELL).fill(color);

        if (cell.visited && cell.pr >= 0) {
          drawArrow(r, c, cell.pr, cell.pc);
        }
      }
    }

    if (startR >= 0) {
      const bw = 68, bh = 30, gap = 6, pad = 10;
      const by = H - bh - pad;
      const buttons = [];
      if (autoPlaying) {
        buttons.push({ l: 'Stop', c: 0xd32f2f, a: play });
      } else {
        if (history.length > 0) buttons.push({ l: 'Prev', c: 0x757575, a: prevStep });
        if (queue.length > 0) buttons.push({ l: 'Next', c: 0x1a73e8, a: bfsStep });
        if (queue.length > 0) buttons.push({ l: 'Play', c: 0x00897b, a: play });
        if (queue.length > 0) buttons.push({ l: 'Finish', c: 0xe65100, a: finish });
      }

      const totalW = buttons.length * bw + (buttons.length - 1) * gap;
      let bx = W - totalW - pad;
      for (const btn of buttons) {
        drawButton(bx, by, bw, bh, btn.l, btn.c, btn.a);
        bx += bw + gap;
      }
    }
  }

  function getCanvasCoords(e) {
    const rect = app.canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function isOnButton(mx, my) {
    return buttonRects.some(r => mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h);
  }

  app.canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });

  app.canvas.addEventListener('mouseup', (e) => {
    const coords = getCanvasCoords(e);
    if (isOnButton(coords.x, coords.y)) return;

    const cell = getCell(coords.x, coords.y);
    if (!cell) return;

    if (e.button === 2) {
      toggleObstacle(cell.r, cell.c);
    } else if (e.button === 0) {
      if (grid[cell.r][cell.c].obstacle) return;

      if (startR < 0) {
        setStart(cell.r, cell.c);
      } else if (endR < 0) {
        setEndPoint(cell.r, cell.c);
      } else {
        setStart(cell.r, cell.c);
      }
    }
  });

  app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  initGrid();
  render();
})();
