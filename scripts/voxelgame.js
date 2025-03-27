import * as THREE from 'three';

class VoxelGame {
    constructor(scene) {
        this.scene = scene;
        this.points = 0;
        this.bananium = 0;
        this.total404Tokens = 404404404;
        this.dailyRewardPool = 2000;
        this.voxels = [];
        this.voxelTypes = ['type1', 'type2', 'type3', 'type4', 'type5', 'type6', 'type7', 'type8'];
        this.rarityLevels = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        this.bananiumRewards = { common: 1, uncommon: 2, rare: 4, epic: 8, legendary: 16 };
        this.voxelStore = { 100: 2, 250: 4, 500: 7, 1000: 10 };
        this.playerInventory = {};
        this.flyingLands = [];
        this.groundPlots = [];
        this.ownedLands = [];
        this.player404Tokens = 0;
        this.generateFlyingLands();
        this.generateGroundPlots();
    }

    generateFlyingLands() {
        for (let i = 0; i < 1000; i++) {
            let position = new THREE.Vector3(
                (Math.random() - 0.5) * 500,
                Math.random() * 100 + 50, // Flying lands are above ground
                (Math.random() - 0.5) * 500
            );
            let land = this.createLand(4, position, 0x8B4513);
            this.flyingLands.push(land);
            this.scene.add(land);
        }
    }

    generateGroundPlots() {
        for (let x = -250; x < 250; x += 5) {
            for (let z = -250; z < 250; z += 5) {
                let position = new THREE.Vector3(x, 0, z);
                let plot = this.createLand(1, position, 0x228B22);
                this.groundPlots.push(plot);
                this.scene.add(plot);
            }
        }
    }

    createLand(size, position, color) {
        let geometry = new THREE.BoxGeometry(size, 1, size);
        let material = new THREE.MeshStandardMaterial({ color: color });
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        return mesh;
    }

    purchaseVoxels(packSize) {
        if (!this.voxelStore[packSize]) return;
        if (this.points < this.voxelStore[packSize]) return;

        this.points -= this.voxelStore[packSize];
        let newVoxels = [];

        for (let i = 0; i < packSize; i++) {
            let randomType = this.voxelTypes[Math.floor(Math.random() * this.voxelTypes.length)];
            let newVoxel = { type: randomType, rarity: 'common' };
            newVoxels.push(newVoxel);
            this.addToInventory(newVoxel);
        }
    }

    addToInventory(voxel) {
        let key = `${voxel.type}_${voxel.rarity}`;
        if (!this.playerInventory[key]) this.playerInventory[key] = 0;
        this.playerInventory[key]++;
        this.bananium += this.bananiumRewards[voxel.rarity];
    }

    mergeVoxels(type, rarity) {
        let key = `${type}_${rarity}`;
        if (this.playerInventory[key] < 2) return;

        let nextRarityIndex = this.rarityLevels.indexOf(rarity) + 1;
        if (nextRarityIndex >= this.rarityLevels.length) return;

        let newRarity = this.rarityLevels[nextRarityIndex];
        this.playerInventory[key] -= 2;

        let newKey = `${type}_${newRarity}`;
        if (!this.playerInventory[newKey]) this.playerInventory[newKey] = 0;
        this.playerInventory[newKey]++;
    }

    distributeRewardPool() {
        let share = this.bananium / this.dailyRewardPool;
        let earned404 = share * this.dailyRewardPool;
        this.player404Tokens += earned404;
    }

    buyFlyingLand() {
        if (this.player404Tokens < 20) return;
        this.player404Tokens -= 20;
        let land = this.flyingLands.pop();
        if (land) this.ownedLands.push(land);
    }

    generateVoxelMesh(voxel, position) {
        let geometry = new THREE.BoxGeometry(1, 1, 1);
        let material = new THREE.MeshStandardMaterial({ color: this.getVoxelColor(voxel.rarity) });
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        this.scene.add(mesh);
    }

    getVoxelColor(rarity) {
        const colors = { common: 0xaaaaaa, uncommon: 0x00ff00, rare: 0x0000ff, epic: 0xff00ff, legendary: 0xffa500 };
        return colors[rarity] || 0xffffff;
    }
}

export default VoxelGame;
