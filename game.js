let scene, camera, renderer;
let player, velocity = { x: 0, y: 0, z: 0 };
let keys = { w: false, a: false, s: false, d: false, space: false };
let gravity = 0.02, isJumping = false;
let playerHealth = 100;
let enemy, enemySpeed = 0.02;
let gameOver = false;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    light.castShadow = true;
    scene.add(light);
    const skyGeo = new THREE.SphereGeometry(500, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: {
            topColor: { value: new THREE.Color(0x22b0dd) }, // Top color (sky)
            bottomColor: { value: new THREE.Color(0x87CEEB) } // Bottom color (ground)
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vWorldPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition).y * 0.5 + 0.5;
                gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
            }
        `,
        side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
    const textureLoader = new THREE.TextureLoader();
    const groundTexture = textureLoader.load("assets/grass.jpg");
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(40, 40);
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const loader = new THREE.GLTFLoader();
    loader.load("assets/untitled.glb", (gltf) => {
        player = gltf.scene;
        player.position.set(0, 0.5, 0);
        scene.add(player);
    });
    const enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
    const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.position.set(5, 0.5, 5);
    scene.add(enemy);
    document.addEventListener("keydown", (event) => {
        if (keys.hasOwnProperty(event.key.toLowerCase())) keys[event.key.toLowerCase()] = true;
    });
    document.addEventListener("keyup", (event) => {
        if (keys.hasOwnProperty(event.key.toLowerCase())) keys[event.key.toLowerCase()] = false;
    });
    animate();
}

function updateEnemy() {
    if (!player || !enemy || gameOver) return;
    const direction = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
    enemy.position.addScaledVector(direction, enemySpeed);
    if (enemy.position.distanceTo(player.position) < 1.5) {
        dealDamage();
    }
}

let lastDamageTime = 0;
let damageInterval = 1000; // Enemy deals damage every 1000ms (1 second)

function dealDamage() {
    let now = Date.now();
    if (now - lastDamageTime >= damageInterval) { // Check if enough time has passed
        lastDamageTime = now; // Reset timer
        if (gameOver) return;
        playerHealth -= 10;
        updateHealthBar();
        console.log("Player hit! Health:", playerHealth);
        if (playerHealth <= 0) {
            gameOver = true;
            console.log("Game Over");
            document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20%;'>Game Over</h1>";
        }
    }
}

function updateHealthBar() {
    const healthBar = document.getElementById("healthBar");
    healthBar.style.width = playerHealth + "%";
    // Change color of health bar based on health
    if (playerHealth > 50) {
        healthBar.style.backgroundColor = "green";
    } else if (playerHealth > 20) {
        healthBar.style.backgroundColor = "orange";
    } else {
        healthBar.style.backgroundColor = "red";
    }
}

function animate() {
    if (gameOver) return;
    requestAnimationFrame(animate);
    if (player) {
        let moveSpeed = 0.1;
        let velocityX = 0, velocityZ = 0;
        if (keys.w) velocityZ = -moveSpeed;
        if (keys.s) velocityZ = moveSpeed;
        if (keys.a) velocityX = -moveSpeed;
        if (keys.d) velocityX = moveSpeed;
        player.position.x += velocityX;
        player.position.z += velocityZ;
        if (keys.space && !isJumping) {
            velocity.y = 0.2;
            isJumping = true;
        }
        if (isJumping) {
            player.position.y += velocity.y;
            velocity.y -= gravity;
            if (player.position.y <= 0.5) {
                player.position.y = 0.5;
                isJumping = false;
                velocity.y = 0;
            }
        }
        camera.position.set(player.position.x, player.position.y + 2, player.position.z + 5);
        camera.lookAt(player.position);
    }
    updateEnemy();
    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();