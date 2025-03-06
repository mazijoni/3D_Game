let scene, camera, renderer;
let player, velocity = { x: 0, y: 0, z: 0 };
let keys = { w: false, a: false, s: false, d: false, space: false };
let gravity = 0.02, isJumping = false;
let playerHealth = 100;
let enemy, enemySpeed = 0.07;
let gameOver = false;
let cameraAngleX = 0, cameraAngleY = 0;
let isMouseDown = false;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    scene.add(light);

    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const textureLoader = new THREE.TextureLoader();
    const groundTexture = textureLoader.load("assets/grass.jpg");
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(40, 40);
    const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const loader = new THREE.GLTFLoader();
    loader.load("assets/untitled.glb", (gltf) => {
        player = gltf.scene;
        player.position.set(0, 0.5, 0);
        scene.add(player);
    });

    enemy = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    enemy.position.set(5, 0.5, 5);
    scene.add(enemy);

    document.addEventListener("keydown", (event) => {
        if (keys.hasOwnProperty(event.key.toLowerCase())) keys[event.key.toLowerCase()] = true;
    });
    document.addEventListener("keyup", (event) => {
        if (keys.hasOwnProperty(event.key.toLowerCase())) keys[event.key.toLowerCase()] = false;
    });

    document.addEventListener("mousedown", () => { isMouseDown = true; });
    document.addEventListener("mouseup", () => { isMouseDown = false; });
    document.addEventListener("mousemove", (event) => {
        if (isMouseDown) {
            cameraAngleX -= event.movementX * 0.002;
            cameraAngleY += event.movementY * 0.002;
            cameraAngleY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraAngleY));
        }
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
let damageInterval = 1000;

function dealDamage() {
    let now = Date.now();
    if (now - lastDamageTime >= damageInterval) {
        lastDamageTime = now;
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

    let moveSpeed = 0.1;
    let direction = new THREE.Vector3(Math.sin(cameraAngleX), 0, Math.cos(cameraAngleX)).normalize();
    let right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();

    let moveX = 0, moveZ = 0;
    if (keys.w) moveZ -= moveSpeed;
    if (keys.s) moveZ += moveSpeed;
    if (keys.a) moveX += moveSpeed;
    if (keys.d) moveX -= moveSpeed;
    
    player.position.addScaledVector(direction, moveZ);
    player.position.addScaledVector(right, moveX);

    let radius = 5;
    camera.position.x = player.position.x + Math.sin(cameraAngleX) * Math.cos(cameraAngleY) * radius;
    camera.position.z = player.position.z + Math.cos(cameraAngleX) * Math.cos(cameraAngleY) * radius;
    camera.position.y = player.position.y + Math.sin(cameraAngleY) * radius + 2;
    camera.lookAt(player.position);

    updateEnemy();
    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
