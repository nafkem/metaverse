import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"; // Keep one import
import { World } from "./world";
import { Player } from "./player";
import { Physics } from "./physics";
import { setupUI } from "./ui";
import VoxelGame from "./voxelgame.js";
import { ModelLoader } from "./modelLoader";
import { WorldChunk } from './worldChunk';

// Export initialization function
export const initGame = () => {
  // UI Setup
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  // Renderer setup
  const renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x80a0e0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // Scene setup
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x80a0e0, 50, 75);

  // Define chunk size, parameters, and data store
  const chunkSize = { width: 16, height: 16 }; // Example size
  const chunkParams = {
    seed: 12345,
    biomes: {
      scale: 100,
      variation: { amplitude: 0.1, scale: 50 },
      tundraToTemperate: 0.3,
      temperateToJungle: 0.6,
      jungleToDesert: 0.9
    },
    terrain: {
      scale: 50,
      offset: 10,
      magnitude: 20,
      waterOffset: 5
    },
    trees: {
      frequency: 0.1,
      trunk: { minHeight: 3, maxHeight: 6 },
      canopy: { minRadius: 2, maxRadius: 4, density: 0.5 }
    },
    clouds: { scale: 100, density: 0.2 }
  };
  const dataStore = new Map(); // Example data store

  // Create an instance of WorldChunk
  const world = new WorldChunk(chunkSize, chunkParams, dataStore);
  world.generate();
  scene.add(world);

  const player = new Player(scene, world);
  const physics = new Physics(scene);

  // Camera setup
  const orbitCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  orbitCamera.position.set(24, 24, 24);
  orbitCamera.layers.enable(1);

  const controls = new OrbitControls(orbitCamera, renderer.domElement);
  controls.enableDamping = true; // Smooth camera movement
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 10;
  controls.maxDistance = 500;
  controls.maxPolarAngle = Math.PI / 2; // Prevent flipping upside down

  const modelLoader = new ModelLoader((models) => {
    player.setTool(models.pickaxe);
  });

  let sun;
  function setupLights() {
    sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(50, 50, 50);
    sun.castShadow = true;

    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 200;
    sun.shadow.bias = -0.0001;
    sun.shadow.mapSize.set(2048, 2048);

    scene.add(sun);
    scene.add(sun.target);

    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambient);
  }

  function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();

    // Update physics and player movement
    physics.update(0.016, player, world); // Approximate dt with 60 FPS (1/60)
    player.update(world);

    // Add a condition to control when world.update is called
    if (world.asyncLoading && world.loaded) {
      world.update(player);
    }

    // Update sun position relative to the player
    sun.position.copy(player.camera.position).sub(new THREE.Vector3(-50, -50, -50));
    sun.target.position.copy(player.camera.position);

    // Adjust orbit camera to follow the player
    orbitCamera.position.copy(player.position).add(new THREE.Vector3(16, 16, 16));
    controls.target.copy(player.position);

    renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera);
    stats.update();
  }

  setupLights();
  animate();

  // Handle window resize
  window.addEventListener("resize", () => {
    orbitCamera.aspect = window.innerWidth / window.innerHeight;
    orbitCamera.updateProjectionMatrix();
    player.camera.aspect = window.innerWidth / window.innerHeight;
    player.camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  setupUI(world, player, physics, scene);

  // Return cleanup function
  return () => {
    window.removeEventListener("resize", () => {});

    if (stats.dom.parentNode) {
      stats.dom.parentNode.removeChild(stats.dom);
    }
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
};

initGame();
