const SIZE = 32;
const DIM = {
  x: Math.floor(innerWidth / SIZE),
  y: Math.floor(innerHeight / SIZE),
};
let DIRECTORY = Math.random() < 0.5 ? "pipes/" : "pipes2/";
const SPEED = 1;
let SEED = false;
const IMAGES = [
  {
    src: "blank.png",
    sockets: ["AAA", "AAA", "AAA", "AAA"],
    rotations: [0],
    weight: 2,
  },
  {
    src: "tcross.png",
    sockets: ["ABA", "ABA", "AAA", "ABA"],
    rotations: [0, 1, 2, 3],
    weight: 1,
  },
  {
    src: "line.png",
    sockets: ["ABA", "AAA", "ABA", "AAA"],
    rotations: [0, 1],
    weight: 1,
  },
  {
    src: "corner.png",
    sockets: ["AAA", "ABA", "ABA", "AAA"],
    rotations: [0, 1, 2, 3],
    weight: 1,
  },
  {
    src: "cross.png",
    sockets: ["ABA", "ABA", "ABA", "ABA"],
    rotations: [0],
    weight: 1,
  },
  {
    src: "end.png",
    sockets: ["AAA", "AAA", "ABA", "AAA"],
    rotations: [0, 1, 2, 3],
    weight: 0.1,
  },
];

let grid = [];
let tiles = [];
let changedEntropy = [];

function Start() {
  InitializeDJ();
  InitializeTiles();
  InitializeGrid();
}

function InitializeDJ() {
  dj.createCanvas(DIM.x * SIZE, DIM.y * SIZE);
  dj.background(51);
  dj.bodyBackground(0);
  dj.ctx.imageSmoothingEnabled = false;
  dj.slower("x");
  dj.faster("y");
  dj.speed = SPEED;
  if (SEED) dj.setSeed(SEED);
}

function InitializeTiles() {
  tiles = [];
  IMAGES.forEach((image, i) => {
    image.rotations.forEach((r, j) => {
      const imgFile = new Image();
      imgFile.src = `${DIRECTORY}${image.src}`;
      const tileImg = new TileImg(imgFile, r);
      let tile = new Tile(tileImg, image.sockets, r, image.weight);
      tiles.push(tile);
    });
  });
}

function InitializeGrid() {
  dj.background(51);

  grid = [];

  for (let j = 0; j < DIM.y; j++) {
    grid.push([]);

    for (let i = 0; i < DIM.x; i++) {
      grid[j].push(new Square(j, i));
    }
  }

  changedEntropy = [dj.random(dj.random(grid))];
}

function Draw() {
  Update();
}

function keyPressed(key) {
  if (key == " ") Restart();
  if (key == "d") Draw();
  if (parseInt(key) < 10) dj.speed = parseInt(key);
}

function Update() {
  UpdateOptions();
  CollapseLowestEntropy();
}

const Done = () => (dj.speed = 0);

const Restart = () => {
  dj.speed = 1;
  DIRECTORY = Math.random() < 0.5 ? "pipes/" : "pipes2/";
  InitializeTiles();
  InitializeGrid();
};

const UpdateOptions = () => changedEntropy.forEach((sq) => sq.checkOptions());

function CollapseLowestEntropy() {
  const choice = dj.random(FindLowestEntropy());
  if (!choice) return Done();
  choice.collapse();
}

function FindLowestEntropy() {
  let candidates = [];
  let lowest = Infinity;

  if (changedEntropy.length === 0) changedEntropy = GetGrid();
  changedEntropy.forEach((sq) => {
    if (!sq.collapsed && sq.entropy < lowest) {
      candidates = [sq];
      lowest = sq.entropy;
    } else if (!sq.collapsed && sq.entropy == lowest) {
      candidates.push(sq);
    }
  });

  if (lowest == Infinity) return false;

  return candidates;
}

function GetGrid() {
  let arr = [];
  grid.forEach((row) => (arr = arr.concat(row)));
  return arr;
}

function ReverseString(str) {
  const arr = str.split("");
  arr.reverse();
  return arr.join("");
}

class Tile {
  constructor(img, sockets, rotation, weight) {
    this.img = img;
    this.sockets = sockets;
    this.rotation = rotation;
    this.weight = weight;
    this.rotateSockets(this.rotation);
  }

  rotateSockets(r) {
    let newSockets = [];
    this.sockets.forEach((s, i) => {
      newSockets[i] =
        this.sockets[(i - r + this.sockets.length) % this.sockets.length];
    });
    this.sockets = newSockets;
  }
}

class TileImg {
  constructor(src, rotation) {
    this.src = src;
    this.w = SIZE;
    this.h = SIZE;
    this.rotation = rotation;
  }

  show(x, y) {
    dj.ctx.save();
    dj.ctx.translate(x + this.w / 2, y + this.h / 2);
    dj.ctx.rotate((this.rotation * PI) / 2);
    dj.ctx.drawImage(this.src, -this.w / 2, -this.h / 2, this.w, this.h);
    dj.ctx.restore();
  }
}

class Square {
  constructor(j, i) {
    this.j = j;
    this.i = i;
    this.getNeighbors();
    this.collapsed = false;
    this.options = tiles;
    this.entropy = this.options.length;
    this.tile = null;
  }

  getNeighbors() {
    this.neighbors = [
      {
        j: this.j - 1,
        i: this.i,
      },
      {
        j: this.j,
        i: this.i + 1,
      },
      {
        j: this.j + 1,
        i: this.i,
      },
      {
        j: this.j,
        i: this.i - 1,
      },
    ];
  }

  checkOptions() {
    if (this.collapsed) return;
    let opts = [];
    for (let n of this.neighbors)
      opts.push(this.checkTile(n.j - this.j, n.i - this.i));

    let valid = [];
    tiles.forEach((tile) => {
      let counter = 0;
      opts.forEach((dir) => {
        if (dir.includes(tile)) counter++;
      });
      if (counter == opts.length) valid.push(tile);
    });

    this.options = valid;
    this.entropy = this.options.length;
  }

  checkTile(rj, ri) {
    const j = this.j + rj;
    const i = this.i + ri;

    let socket;
    let opts = [];
    const side = rj == 0 ? (ri + 4) % 4 : Math.sign(rj) + 1;

    if (j < 0 || i < 0 || j == DIM.y || i == DIM.x) socket = "AAA";
    else {
      if (!grid[j][i].collapsed) return tiles;

      const otherSide = (side + 2) % 4;
      socket = ReverseString(grid[j][i].tile.sockets[otherSide]);
    }

    tiles.forEach((tile) => {
      if (tile.sockets[side] == socket) opts.push(tile);
    });

    return opts;
  }

  collapse() {
    // dj.fill(255, 0, 0); // just for debugging
    // dj.rect(this.i * SIZE, this.j * SIZE, SIZE, SIZE);
    if (this.options.length == 0) return Done();
    this.collapsed = true;
    this.tile = this.chooseTile();
    this.entropy = 0;
    this.options = [];
    this.updateChangedEntropy();
    this.show();
  }

  chooseTile() {
    let sum = 0;
    this.options.forEach((tile) => (sum += tile.weight));
    const rnd = dj.random(sum);

    let counter = 0;
    let pick = undefined;
    for (let i = 0; i < this.options.length; i++) {
      counter += this.options[i].weight;
      if (counter > rnd) {
        pick = i;
        break;
      }
    }

    return this.options[pick];
  }

  updateChangedEntropy() {
    changedEntropy = [];
    for (const n of this.neighbors) {
      if (n.j >= 0 && n.j < DIM.y && n.i >= 0 && n.i < DIM.x) {
        const sq = grid[n.j][n.i];
        if (!sq.collapsed) {
          changedEntropy.push(sq);
        }
      }
    }
  }

  show() {
    this.tile.img.show(this.i * SIZE, this.j * SIZE);
  }
}
