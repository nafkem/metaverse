import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import { DataStore } from './dataStore';

export class World extends THREE.Group {
  flyingLands = [];
  groundPlots = new Map();
  asyncLoading = true;
  drawDistance = 3;
  
  chunkSize = { width: 32, height: 32 };

  params = {
    seed: 0,
    terrain: {
      scale: 100,
      magnitude: 8,
      offset: 6,
      waterOffset: 4
    },
    biomes: {
      scale: 500,
      variation: {
        amplitude: 0.2,
        scale: 50
      },
      tundraToTemperate: 0.25,
      temperateToJungle: 0.5,
      jungleToDesert: 0.75
    },
    trees: {
      trunk: {
        minHeight: 4,
        maxHeight: 7
      },
      canopy: {
        minRadius: 3,
        maxRadius: 3,
        density: 0.7
      },
      frequency: 0.005
    },
    clouds: {
      scale: 30,
      density: 0.3
    }
  };

  dataStore = new DataStore();

  constructor(seed = 0) {
    super();
    this.seed = seed;
    this.generateFlyingLands();

    document.addEventListener('keydown', (ev) => {
      switch (ev.code) {
        case 'F1':
          this.save();
          break;
        case 'F2':
          this.load();
          break;
      }
    });
  }

  generateFlyingLands() {
    for (let i = 0; i < 1000; i++) {
      const land = new WorldChunk(this.chunkSize, this.params, this.dataStore);
      land.position.set(
        (Math.random() - 0.5) * 5000,
        150 + Math.random() * 100,
        (Math.random() - 0.5) * 5000
      );
      this.flyingLands.push(land);
      this.add(land);
    }
  }

  getOrCreateGroundPlot(x, z) {
    const key = `${x},${z}`;
    if (!this.groundPlots.has(key)) {
      const plot = new WorldChunk({ width: 8, height: 8 }, this.params, this.dataStore);
      plot.position.set(x * 8, 0, z * 8);
      this.groundPlots.set(key, plot);
      this.add(plot);
    }
    return this.groundPlots.get(key);
  }

  updateWorld(player) {
    const { x, z } = player.position;
    const gridX = Math.floor(x / 8);
    const gridZ = Math.floor(z / 8);
    this.getOrCreateGroundPlot(gridX, gridZ);
  }

  save() {
    localStorage.setItem('world_params', JSON.stringify(this.params));
    localStorage.setItem('world_data', JSON.stringify(this.dataStore.data));
    this.displayStatus('GAME SAVED');
  }

  load() {
    this.params = JSON.parse(localStorage.getItem('world_params')) || this.params;
    this.dataStore.data = JSON.parse(localStorage.getItem('world_data')) || {};
    this.displayStatus('GAME LOADED');
    this.generate(true);
  }

  displayStatus(message) {
    const status = document.getElementById('status');
    if (status) {
      status.innerHTML = message;
      setTimeout(() => (status.innerHTML = ''), 3000);
    }
  }

  generate(clearCache = false) {
    if (clearCache) this.dataStore.clear();
    this.disposeChunks();
    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        this.generateChunk(x, z);
      }
    }
  }

  disposeChunks() {
    // Remove all chunks from the scene and clear groundPlots and flyingLands
    this.groundPlots.forEach((chunk) => {
      this.remove(chunk);
    });
  
    this.flyingLands.forEach((chunk) => {
      this.remove(chunk);
    });
  
    this.groundPlots.clear();
    this.flyingLands = [];
  }
  
  generate(clearCache = false) {
    if (clearCache) this.dataStore.clear();
    
    // Ensure disposeChunks exists before calling
    if (typeof this.disposeChunks === "function") {
      this.disposeChunks();
    }
  
    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        this.generateChunk(x, z);
      }
    }
  }
  

  generateChunk(x, z) {
    const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
    chunk.userData = { x, z };

    if (this.asyncLoading) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }

    this.add(chunk);
  }
}
