    /**
     * 初始化生态系统
     */
    initEcology() {
        // 如果 WorldLoader 有实体数据，用它初始化动物位置
        const cowsData = this.worldLoader ? this.worldLoader.getEntitiesByType('cow') : [];
        const dogsData = this.worldLoader ? this.worldLoader.getEntitiesByType('dog') : [];
        
        // 初始化 Cow
        const cowPositions = [
            { x: -85, z: -40 },
            { x: -78, z: -50 },
            { x: -88, z: -20 },
            { x: -72, z: -35 },
        ];
        cowPositions.forEach((pos, i) => {
            const entityData = cowsData[i]; // 服务器数据优先
            const cow = new Cow(entityData?.position?.x ?? pos.x, entityData?.position?.z ?? pos.z, entityData);
            this.cows.push(cow);
            this.scene.add(cow.group);
        });
        
        // 初始化 Dog
        const dogPositions = [
            { x: -50, z: -30 },
            { x: -55, z: -45 },
            { x: -40, z: 0 },
            { x: 55, z: -50 },
            { x: 45, z: -60 },
        ];
        dogPositions.forEach((pos, i) => {
            const entityData = dogsData[i]; // 服务器数据优先
            const dog = new Dog(entityData?.position?.x ?? pos.x, entityData?.position?.z ?? pos.z, entityData);
            this.dogs.push(dog);
            this.scene.add(dog.group);
        });
        
        console.log(`[App] Created ${this.cows.length} cows and ${this.dogs.length} dogs`);

        console.log('[App] Ecology initialized');
    }
