import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DragControls } from "three/examples/jsm/controls/DragControls.js";

// Cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Câmera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 12;

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controles de órbita (apenas na cena principal)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.enablePan = true;

// Geometrias dos sólidos platônicos
const geometries = {
  tetrahedron: new THREE.TetrahedronGeometry(1.5),
  cube: new THREE.BoxGeometry(2, 2, 2),
  octahedron: new THREE.OctahedronGeometry(2.5),
  dodecahedron: new THREE.DodecahedronGeometry(3),
  icosahedron: new THREE.IcosahedronGeometry(3.5),
};

// Materiais (cores e wireframe)
const materials = {
  tetrahedron: new THREE.MeshPhongMaterial({ color: 0xff0000, specular: 0xffffff, shininess: 100, wireframe: true }),
  cube: new THREE.MeshPhongMaterial({ color: 0x8b4513, specular: 0xffffff, shininess: 100, wireframe: true }),
  octahedron: new THREE.MeshPhongMaterial({ color: 0xffd700, specular: 0xffffff, shininess: 100, wireframe: true }),
  dodecahedron: new THREE.MeshPhongMaterial({ color: 0x9400d3, specular: 0xffffff, shininess: 100, wireframe: true }),
  icosahedron: new THREE.MeshPhongMaterial({ color: 0x0000ff, specular: 0xffffff, shininess: 100, wireframe: true }),
};

// Cores dos sólidos (global)
const solidColors = {
  tetrahedron: 0xff0000, // Vermelho
  cube: 0x8b4513, // Marrom
  octahedron: 0xffd700, // Dourado
  dodecahedron: 0x9400d3, // Roxo
  icosahedron: 0x0000ff, // Azul
};

// Criação dos sólidos individuais
const solids = {};
const solidosContainer = document.getElementById("solidos-container");
const solidNames = ["icosahedron", "octahedron", "tetrahedron", "cube", "dodecahedron"];
const draggableObjects = [];
const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

// Função para criar as estrelas
function createStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
  const starVertices = [];
  for (let i = 0; i < 1000; i++) {
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(2000);
    const z = THREE.MathUtils.randFloatSpread(2000);
    starVertices.push(x, y, z);
  }
  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3));
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

// Luz ambiente
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Múltiplas luzes direcionais para melhor iluminação
const lightIntensity = 0.5;
const lightPositions = [
  [1, 1, 1], // Direita, cima, frente
  [-1, 1, 1], // Esquerda, cima, frente
  [1, -1, 1], // Direita, baixo, frente
  [-1, -1, 1], // Esquerda, baixo, frente
];

for (const position of lightPositions) {
  const directionalLight = new THREE.DirectionalLight(0xffffff, lightIntensity);
  directionalLight.position.set(...position);
  scene.add(directionalLight);
}

let x = -14;
for (const name of solidNames) {
  const geometry = geometries[name];
  const material = materials[name];
  solids[name] = new THREE.Mesh(geometry, material);
  solids[name].name = name;
  solids[name].position.set(x, 0, 0);
  scene.add(solids[name]);
  draggableObjects.push(solids[name]);

  // Ícone do sólido (agora usa uma cópia do sólido sem vértices)
  const iconSolid = new THREE.Mesh(geometry.clone(), material.clone());
  const iconScene = new THREE.Scene();
  iconScene.background = new THREE.Color(solidColors[name]);
  iconScene.add(iconSolid); 

  const iconRenderer = new THREE.WebGLRenderer({ alpha: true }); 
  iconRenderer.setSize(100, 100);

  const iconCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  const boundingBox = new THREE.Box3().setFromObject(iconSolid); 
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  iconCamera.position.z = maxDimension * 2; 

  const iconContainer = document.createElement("div");
  iconContainer.classList.add("icon-container"); 
  iconContainer.appendChild(iconRenderer.domElement);
  solidosContainer.appendChild(iconContainer); 

  function renderIcon() {
    iconRenderer.render(iconScene, iconCamera);
    requestAnimationFrame(renderIcon);
  }
  renderIcon();

  iconContainer.addEventListener("click", () => {
    window.open(`solido.html?nome=${name}`, "_blank");
  });

  x += 7;

  // Adiciona as bolinhas nos vértices (apenas na cena principal)
  if (solids[name].geometry.attributes.position && solids[name].geometry.attributes.position.array) {
    const vertices = solids[name].geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const vertex = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.copy(vertex);
      solids[name].add(sphere);
    }
  }
}

// DragControls
const dragControls = new DragControls(
  draggableObjects,
  camera,
  renderer.domElement
);
dragControls.addEventListener("dragstart", function (event) {
  controls.enabled = false;
});
dragControls.addEventListener("dragend", function (event) {
  controls.enabled = true;
});

// Raycaster e mouse para interação
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Tooltip para exibir a mensagem
const tooltip = document.createElement("div");
tooltip.id = "tooltip";
tooltip.style.position = "absolute";
tooltip.style.display = "none";
document.body.appendChild(tooltip);

// Função para lidar com o movimento do mouse
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < intersects.length; i++) {
    if (intersects[i].object.geometry === sphereGeometry) {
      tooltip.style.left = event.clientX + "px";
      tooltip.style.top = event.clientY + "px";
      tooltip.style.display = "block";
      tooltip.textContent = "Inserir aqui";
      break;
    } else {
      tooltip.style.display = "none";
    }
  }
}

window.addEventListener("mousemove", onMouseMove, false);

// Função de animação
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

