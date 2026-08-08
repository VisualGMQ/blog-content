(async () => {
  const COLS = 15, ROWS = 12, CELL = 28, GAP = 2;
  const W = COLS * (CELL + GAP) + GAP;
  const H = ROWS * (CELL + GAP) + GAP;

  const OBSTACLE_SET = new Set([
    '2,3','2,4','2,5','2,6','2,7','2,8','2,9','2,10',
    '6,1','6,2','6,3','6,4','6,11','6,12','6,13','6,14',
    '10,5','10,6','10,7','10,8','10,9','10,10',
    '3,8','4,8','5,8',
  ]);
  const COST2_SET = new Set([
    '0,7','0,8',
    '3,1','3,2','3,13','3,14',
    '7,5','7,6','7,7','7,8','7,9',
    '11,4','11,5','11,9','11,10',
  ]);
  const COST3_SET = new Set([
    '1,5','1,6',
    '4,12','4,13',
    '8,2','8,3','8,4','8,10','8,11','8,12',
  ]);
  const COST4_SET = new Set([
    '5,3','5,4',
    '9,6','9,7','9,8',
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
  let done = false;
  let history = [];
  let pathSet = new Set();

  function heuristic(r, c) {
    if (endR < 0 || endC < 0) return 0;
    return Math.abs(r - endR) + Math.abs(c - endC);
  }

  function priority(r, c) {
    return heuristic(r, c) + grid[r][c].cost;
  }

  function initGrid() {
    grid = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => {
        let cost = 1;
        if (OBSTACLE_SET.has(`${r},${c}`)) cost = Infinity;
        else if (COST4_SET.has(`${r},${c}`)) cost = 4;
        else if (COST3_SET.has(`${r},${c}`)) cost = 3;
        else if (COST2_SET.has(`${r},${c}`)) cost = 2;
        return { cost, origCost: cost, dist: Infinity, pr: -1, pc: -1 };
      })
    );
  }

  function resetSearch() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        grid[r][c].dist = Infinity;
        grid[r][c].pr = -1;
        grid[r][c].pc = -1;
      }
    }
    queue = [];
    startR = -1;
    startC = -1;
    endR = -1;
    endC = -1;
    done = false;
    history = [];
    pathSet.clear();
  }

  function softReset() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        grid[r][c].dist = Infinity;
        grid[r][c].pr = -1;
        grid[r][c].pc = -1;
      }
    }
    queue = [];
    history = [];
    pathSet.clear();
    done = false;
  }

  function snapshot() {
    return {
      queue: queue.map(item => ({ r: item.r, c: item.c, pri: item.pri })),
      grid: grid.map(row => row.map(cell => ({
        cost: cell.cost,
        dist: cell.dist,
        pr: cell.pr,
        pc: cell.pc,
      }))),
      startR, startC, endR, endC,
      done,
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
    done = snap.done;
    pathSet = snap.pathSet;
  }

  function rebuildPath() {
    pathSet.clear();
    if (endR < 0 || endC < 0) return;
    if (grid[endR][endC].dist === Infinity || grid[endR][endC].cost === Infinity) return;
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
    softReset();
    startR = r;
    startC = c;
    endR = -1;
    endC = -1;
    grid[r][c].dist = 0;
    render();
  }

  function setEndPoint(r, c) {
    stopAutoPlay();
    if (grid[r][c].cost === Infinity || r === startR && c === startC) return;
    softReset();
    endR = r;
    endC = c;
    grid[startR][startC].dist = 0;
    queue.push({ r: startR, c: startC, pri: priority(startR, startC) });
    rebuildPath();
    render();
  }

  function doGreedyStep() {
    if (queue.length === 0) {
      done = true;
      return;
    }
    const { r, c } = queue.shift();
    if (r === endR && c === endC) {
      done = true;
      queue = [];
      return;
    }
    const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const cell = grid[nr][nc];
      if (cell.cost === Infinity) continue;
      const newDist = grid[r][c].dist + cell.cost;
      if (newDist < cell.dist) {
        cell.dist = newDist;
        cell.pr = r;
        cell.pc = c;
        for (let i = 0; i < queue.length; i++) {
          if (queue[i].r === nr && queue[i].c === nc) {
            queue.splice(i, 1);
            break;
          }
        }
        queue.push({ r: nr, c: nc, pri: priority(nr, nc) });
      }
    }
    queue.sort((a, b) => a.pri - b.pri);
    if (queue.length === 0) done = true;
  }

  function greedyStep() {
    stopAutoPlay();
    if (queue.length === 0) {
      done = true;
      render();
      return;
    }
    history.push(snapshot());
    doGreedyStep();
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
    doGreedyStep();
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
      if (r === endR && c === endC) {
        done = true;
        queue = [];
        break;
      }
      const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const cell = grid[nr][nc];
        if (cell.cost === Infinity) continue;
        const newDist = grid[r][c].dist + cell.cost;
        if (newDist < cell.dist) {
          cell.dist = newDist;
          cell.pr = r;
          cell.pc = c;
          for (let i = 0; i < queue.length; i++) {
            if (queue[i].r === nr && queue[i].c === nc) {
              queue.splice(i, 1);
              break;
            }
          }
          queue.push({ r: nr, c: nc, pri: priority(nr, nc) });
        }
      }
      queue.sort((a, b) => a.pri - b.pri);
    }
    done = true;
    rebuildPath();
    render();
  }

  function toggleObstacle(r, c) {
    stopAutoPlay();
    resetSearch();
    if (grid[r][c].cost === Infinity) {
      grid[r][c].cost = grid[r][c].origCost === Infinity ? 1 : grid[r][c].origCost;
    } else {
      grid[r][c].cost = Infinity;
    }
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

  const container = document.getElementById('pixi-greedy-demo');
  container.appendChild(app.canvas);

  const gridGfx = new PIXI.Graphics();
  const arrowGfx = new PIXI.Graphics();
  const btnLayer = new PIXI.Container();
  app.stage.addChild(gridGfx, arrowGfx, btnLayer);

  app.stage.eventMode = 'static';
  app.stage.hitArea = new PIXI.Rectangle(0, 0, W, H);

  let buttonRects = [];

  function terrainColor(cost) {
    if (cost === 1) return 0xd0d0d0;
    if (cost === 2) return 0xb0b0b0;
    if (cost === 3) return 0x909090;
    if (cost === 4) return 0x707070;
    return 0x555555;
  }

  function visitedColor(cost) {
    const f = 1 - (cost - 1) * 0.15;
    const r = Math.round(0x42 * f);
    const g = Math.round(0xa5 * f);
    const b = Math.round(0xf5 * f);
    return (r << 16) | (g << 8) | b;
  }

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
          if (grid[nr][nc].dist === Infinity && grid[nr][nc].cost !== Infinity) {
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
        } else if (cell.dist !== Infinity && cell.cost !== Infinity) {
          color = visitedColor(cell.cost);
        } else {
          color = terrainColor(cell.cost);
        }

        gridGfx.rect(x, y, CELL, CELL).fill(color);

        if (cell.dist !== Infinity && cell.pr >= 0) {
          drawArrow(r, c, cell.pr, cell.pc);
        }
      }
    }

    const canSearch = startR >= 0 && endR >= 0;
    if (startR >= 0) {
      const bw = 68, bh = 30, gap = 6, pad = 10;
      const by = H - bh - pad;
      const buttons = [];
      if (autoPlaying) {
        buttons.push({ l: 'Stop', c: 0xd32f2f, a: play });
      } else if (canSearch) {
        if (history.length > 0) buttons.push({ l: 'Prev', c: 0x757575, a: prevStep });
        if (queue.length > 0) buttons.push({ l: 'Next', c: 0x1a73e8, a: greedyStep });
        if (queue.length > 0) buttons.push({ l: 'Play', c: 0x00897b, a: play });
        if (queue.length > 0) buttons.push({ l: 'Finish', c: 0xe65100, a: finish });
      } else {
        const txt = new PIXI.Text({
          text: '请设置终点',
          style: { fontSize: 13, fill: 0x888888, fontFamily: 'sans-serif' },
        });
        txt.x = W - pad - txt.width;
        txt.y = by + bh / 2 - txt.height / 2;
        btnLayer.addChild(txt);
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
      if (grid[cell.r][cell.c].cost === Infinity) return;

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
