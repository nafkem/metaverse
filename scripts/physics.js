import * as THREE from 'three';
import { blocks } from './blocks';
import { Player } from './player';
import { WorldChunk } from './worldChunk';

const collisionMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.2
});
const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001);

const contactMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x00ff00 });
const contactGeometry = new THREE.SphereGeometry(0.05, 6, 6);

export class Physics {
  // Acceleration due to gravity
  gravity = 32;

  // Physic simulation rate
  simulationRate = 250;
  stepSize = 1 / this.simulationRate;
  // Accumulator to keep track of leftover dt
  accumulator = 0;

  constructor(scene) {
    this.helpers = new THREE.Group();
    this.helpers.visible = false;
    scene.add(this.helpers);
  }

  /**
   * Moves the physics simulation forward in time by 'dt'
   * @param {number} dt 
   * @param {Player} player
   * @param {WorldChunk} world
   */
  update(dt, player, world) {
    if (!(world instanceof WorldChunk) || typeof world.getBlock !== 'function') {
      console.error('Invalid world object passed to Physics.update. Ensure it is an instance of WorldChunk or has a compatible getBlock method.');
      return;
    }

    this.accumulator += dt;

    // Safety counter to prevent infinite loops
    let safetyCounter = 0;
    const maxIterations = 100;
    console.log({
      stepSize: this.stepSize, accumulator: this.accumulator, gravity: this.gravity
    })
    while (this.accumulator >= this.stepSize) {
      player.velocity.y -= this.gravity * this.stepSize;
      player.applyInputs(this.stepSize);
      this.detectCollisions(player, world);
      this.accumulator -= this.stepSize;

      // Increment safety counter and break if it exceeds max iterations
      safetyCounter++;
      if (safetyCounter > maxIterations) {
        console.error('Physics.update exceeded maximum iterations. Check stepSize and dt values.');
        break;
      }
    }
  }

  /**
   * Main function for collision detection
   */
  detectCollisions(player, world) {
    if (!(world instanceof WorldChunk)) {
      console.error('Invalid world object passed to detectCollisions. Ensure it is an instance of WorldChunk.');
      return;
    }

    player.onGround = false;
    this.helpers.clear();

    const candidates = this.broadPhase(player, world);
    const collisions = this.narrowPhase(candidates, player);

    if (collisions.length > 0) {
      this.resolveCollisions(collisions, player);
    }
  }

  /**
   * Performs a rough search against the world to return all
   * possible blocks the player may be colliding with
   * @returns {{ id: number, instanceId: number }[]}
   */
  broadPhase(player, world) {
    if (!(world instanceof WorldChunk) || typeof world.getBlock !== 'function') {
      console.error('Invalid world object passed to broadPhase. Ensure it is an instance of WorldChunk.');
      return [];
    }

    const candidates = [];

    // Get the block extents of the player
    const minX = Math.floor(player.position.x - player.radius);
    const maxX = Math.ceil(player.position.x + player.radius);
    const minY = Math.floor(player.position.y - player.height);
    const maxY = Math.ceil(player.position.y);
    const minZ = Math.floor(player.position.z - player.radius);
    const maxZ = Math.ceil(player.position.z + player.radius);

    // Loop through all blocks within the player's bounding box
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = world.getBlock(x, y, z);
          if (block && block.id !== blocks.empty.id) {
            candidates.push({ x, y, z });
            this.addCollisionHelper({ x, y, z });
          }
        }
      }
    }

    return candidates;
  }

  /**
   * Narrows down the blocks found in the broad-phase to the set
   * of blocks the player is actually colliding with
   * @param {{ id: number, instanceId: number }[]} candidates 
   * @returns 
   */
  narrowPhase(candidates, player) {
    const collisions = [];

    for (const block of candidates) {
      // Get the point on the block that is closest to the center of the player's bounding cylinder
      const closestPoint = {
        x: Math.max(block.x - 0.5, Math.min(player.position.x, block.x + 0.5)),
        y: Math.max(block.y - 0.5, Math.min(player.position.y - (player.height / 2), block.y + 0.5)),
        z: Math.max(block.z - 0.5, Math.min(player.position.z, block.z + 0.5))
      };

      // Get distance along each axis between closest point and the center
      // of the player's bounding cylinder
      const dx = closestPoint.x - player.position.x;
      const dy = closestPoint.y - (player.position.y - (player.height / 2));
      const dz = closestPoint.z - player.position.z;

      if (this.pointInPlayerBoundingCylinder(closestPoint, player)) {
        // Compute the overlap between the point and the player's bounding
        // cylinder along the y-axis and in the xz-plane
        const overlapY = (player.height / 2) - Math.abs(dy);
        const overlapXZ = player.radius - Math.sqrt(dx * dx + dz * dz);

        // Compute the normal of the collision (pointing away from the contact point)
        // and the overlap between the point and the player's bounding cylinder
        let normal, overlap;
        if (overlapY < overlapXZ) {
          normal = new THREE.Vector3(0, -Math.sign(dy), 0);
          overlap = overlapY;
          player.onGround = true;
        } else {
          normal = new THREE.Vector3(-dx, 0, -dz).normalize();
          overlap = overlapXZ;
        }

        collisions.push({
          block,
          contactPoint: closestPoint,
          normal,
          overlap
        });

        this.addContactPointerHelper(closestPoint);
      }
    }

    //console.log(`Narrowphase Collisions: ${collisions.length}`);

    return collisions;
  }

  /**
   * Resolves each of the collisions found in the narrow-phase
   * @param {*} collisions 
   * @param {Player} player
   */
  resolveCollisions(collisions, player) {
    // Resolve the collisions in order of the smallest overlap to the largest
    collisions.sort((a, b) => {
      return a.overlap < b.overlap;
    });

    for (const collision of collisions) {
      // We need to re-check if the contact point is inside the player bounding
      // cylinder for each collision since the player position is updated after
      // each collision is resolved
      if (!this.pointInPlayerBoundingCylinder(collision.contactPoint, player)) continue;

      // Adjust position of player so the block and player are no longer overlapping
      let deltaPosition = collision.normal.clone();
      deltaPosition.multiplyScalar(collision.overlap);
      player.position.add(deltaPosition);

      // Get the magnitude of the player's velocity along the collision normal
      let magnitude = player.worldVelocity.dot(collision.normal);
      // Remove that part of the velocity from the player's velocity
      let velocityAdjustment = collision.normal.clone().multiplyScalar(magnitude);

      // Apply the velocity to the player
      player.applyWorldDeltaVelocity(velocityAdjustment.negate());
    }
  }

  /**
   * Returns true if the point 'p' is inside the player's bounding cylinder
   * @param {{ x: number, y: number, z: number }} p 
   * @param {Player} player 
   * @returns {boolean}
   */
  pointInPlayerBoundingCylinder(p, player) {
    const dx = p.x - player.position.x;
    const dy = p.y - (player.position.y - (player.height / 2));
    const dz = p.z - player.position.z;
    const r_sq = dx * dx + dz * dz;

    // Check if contact point is inside the player's bounding cylinder
    return (Math.abs(dy) < player.height / 2) && (r_sq < player.radius * player.radius);
  }

  /**
   * Visualizes the block the player is colliding with
   * @param {THREE.Object3D} block 
   */
  addCollisionHelper(block) {
    const blockMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
    blockMesh.position.copy(block);
    this.helpers.add(blockMesh);
  }

  /**
   * Visualizes the contact at the point 'p'
   * @param {{ x, y, z }} p 
   */
  addContactPointerHelper(p) {
    const contactMesh = new THREE.Mesh(contactGeometry, contactMaterial);
    contactMesh.position.copy(p);
    this.helpers.add(contactMesh);
  }
}