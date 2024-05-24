import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import earthVertexShader from "./shaders/earth/vertex.glsl";
import earthFragmentShader from "./shaders/earth/fragment.glsl";
import atmosphereVertexShader from "./shaders/atmosphere/vertex.glsl";
import atmosphereFragmentShader from "./shaders/atmosphere/fragment.glsl";
import starImage from "../static/particles/6.png";

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const manager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(manager);
manager.onError = function (url) {
  console.log("There was an error loading " + url);
};

// time
const date = new Date();
const hour = date.getHours();

//SPACE
const count = 1000;
const starsGeometry = new THREE.BufferGeometry();

const positionsArray = new Float32Array(count * 3);
for (let index = 0; index < count * 3; index++) {
  const i3 = index * 3;

  positionsArray[i3] = (Math.random() - 0.5) * 70;
  positionsArray[i3 + 1] = (Math.random() - 0.5) * 50;
  positionsArray[i3 + 2] = (Math.random() - 0.5) * 70;
  // positionsArray[index] = (Math.random() - 0.5) * 10;
}

starsGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionsArray, 3)
);

const starTexture = textureLoader.load(starImage);

const starsMaterial = new THREE.PointsMaterial();
starsMaterial.size = 0.7;
starsMaterial.sizeAttenuation = true;
starsMaterial.transparent = true;
starsMaterial.alphaMap = starTexture;
starsMaterial.depthWrite = false;
starsMaterial.blending = THREE.AdditiveBlending;

const stars = new THREE.Points(starsGeometry, starsMaterial);
stars.scale.set;
scene.add(stars);

/**
 * Earth
 */

const earthParameters = {};
earthParameters.atmosphereDayColor = "#00aaff";
earthParameters.atmosphereTwilightColor = "#ff6600";
gui.addColor(earthParameters, "atmosphereDayColor").onChange(() => {
  earthMaterial.uniforms.uAtmosphereDayColor.value.set(
    earthParameters.atmosphereDayColor
  );
  atmosphereMaterial.uniforms.uAtmosphereDayColor.value.set(
    earthParameters.atmosphereDayColor
  );
});

gui.addColor(earthParameters, "atmosphereTwilightColor").onChange(() => {
  atmosphereMaterial.uniforms.uAtmosphereTwilightColor.value.set(
    earthParameters.atmosphereTwilightColor
  );
});

//textures
const earthDayTexture = textureLoader.load("./earth/day.jpg");
earthDayTexture.colorSpace = THREE.SRGBColorSpace;
earthDayTexture.anisotropy = 8;
const earthNightTexture = textureLoader.load("./earth/night.jpg");
earthNightTexture.colorSpace = THREE.SRGBColorSpace;
earthNightTexture.anisotropy = 8;
const earthSpecularCloudsTexture = textureLoader.load(
  "./earth/specularClouds.jpg"
);
earthSpecularCloudsTexture.anisotropy = 8;
// Mesh
const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
const earthMaterial = new THREE.ShaderMaterial({
  vertexShader: earthVertexShader,
  fragmentShader: earthFragmentShader,
  uniforms: {
    uDayTexture: new THREE.Uniform(earthDayTexture),
    uNightTexture: new THREE.Uniform(earthNightTexture),
    uSpecularCloudsTexture: new THREE.Uniform(earthSpecularCloudsTexture),
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uAtmosphereDayColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereDayColor)
    ),
    uAtmosphereTwilightColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereTwilightColor)
    ),
  },
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Atmosphere
const atmosphereMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  transparent: true,
  vertexShader: atmosphereVertexShader,
  fragmentShader: atmosphereFragmentShader,
  uniforms: {
    uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
    uAtmosphereDayColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereDayColor)
    ),
    uAtmosphereTwilightColor: new THREE.Uniform(
      new THREE.Color(earthParameters.atmosphereTwilightColor)
    ),
  },
});

const atmosphere = new THREE.Mesh(earthGeometry, atmosphereMaterial);
atmosphere.scale.set(1.04, 1.04, 1.04);
scene.add(atmosphere);

//sun

// Debug
const debugSun = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.1, 2),
  new THREE.MeshBasicMaterial()
);
scene.add(debugSun);

// theta
let theta = 0.5;
if (hour < 12) {
  theta = 0.5;
} else if (hour < 20) {
  theta = -0.8;
} else {
  theta = Math.PI * 2 * 0.75;
}

// Coordinates
const sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, theta);
const sunDirection = new THREE.Vector3();

const updateSun = () => {
  sunDirection.setFromSpherical(sunSpherical);
  earthMaterial.uniforms.uSunDirection.value.copy(sunDirection);
  atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection);

  // Debug
  debugSun.position.copy(sunDirection).multiplyScalar(5);
};
updateSun();

// Tweaks
gui.add(sunSpherical, "phi").min(0).max(Math.PI).onChange(updateSun);

gui.add(sunSpherical, "theta").min(-Math.PI).max(Math.PI).onChange(updateSun);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 12;
camera.position.y = 5;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);
renderer.setClearColor("#000011");

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  earth.rotation.y = elapsedTime * 0.1;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
