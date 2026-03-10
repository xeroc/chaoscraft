"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";
import StarDetailModal from "./StarDetailModal";

interface StarData {
  issueNumber: number;
  description: string;
  commit: string;
  createdAt: string;
  position: { x: number; y: number; z: number };
}

function generatePosition(commit: string): { x: number; y: number; z: number } {
  const hash = commit.slice(0, 7).padEnd(8, "0");
  const x = (parseInt(hash.substring(0, 2), 16) / 0xff - 0.5) * 100;
  const y = (parseInt(hash.substring(2, 4), 16) / 0xff - 0.5) * 100;
  const z = (parseInt(hash.substring(4, 6), 16) / 0xff - 0.5) * 100;
  return { x, y, z };
}

export default function GalaxyViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [starData, setStarData] = useState<StarData[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0, week: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedStar, setSelectedStar] = useState<StarData | null>(null);

  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const animationRef = useRef<number>();
  const starsRef = useRef<any>([]);

  const raycasterRef = useRef<any>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const selectedMeshRef = useRef<any>(null);
  const selectionRingRef = useRef<any>(null);
  const targetScaleRef = useRef<number>(1);

  const CONFIG = {
    cameraDistance: 150,
    minDistance: 20,
    maxDistance: 300,
    rotationSpeed: 0.0005,
    selectionScaleMultiplier: 2.5,
    selectionAnimationSpeed: 0.08,
  };

  const fetchData = async () => {
    try {
      const [starsRes, statsRes] = await Promise.all([
        fetch("/api/galaxy/stars"),
        fetch("/api/galaxy/stats"),
      ]);

      const starsData = await starsRes.json();
      const statsData = await statsRes.json();

      const stars = (starsData.stars || []).map((star: any) => ({
        ...star,
        position: generatePosition(star.commit),
      }));

      console.log(stars);

      setStarData(stars);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch galaxy data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!containerRef.current || starData.length === 0) return;

    const loadThreeJS = async () => {
      const THREE = await import("three");

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.002);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        60,
        containerRef.current!.clientWidth / containerRef.current!.clientHeight,
        0.1,
        1000,
      );
      camera.position.set(0, 0, CONFIG.cameraDistance);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(
        containerRef.current!.clientWidth,
        containerRef.current!.clientHeight,
      );
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;

      containerRef.current!.appendChild(renderer.domElement);

      createStars(THREE, scene);
      createBackgroundParticles(THREE, scene);

      const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
      scene.add(ambientLight);

      const pointLight = new THREE.PointLight(0xffffff, 1, 500);
      pointLight.position.set(0, 0, 0);
      scene.add(pointLight);

      const raycaster = new THREE.Raycaster();
      raycaster.params.Points.threshold = 2;
      raycasterRef.current = raycaster;

      setupControls(THREE, renderer.domElement, camera, scene);
      setupClickDetection(THREE, renderer.domElement, camera, scene);

      animate(THREE, scene, camera, renderer);
    };

    loadThreeJS();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      if (selectionRingRef.current) {
        if (selectionRingRef.current.geometry) {
          selectionRingRef.current.geometry.dispose();
        }
        if (selectionRingRef.current.material) {
          selectionRingRef.current.material.dispose();
        }
        selectionRingRef.current = null;
      }
      starsRef.current.forEach((mesh: any) => {
        if (mesh && mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh && mesh.material) {
          mesh.material.dispose();
        }
      });
      starsRef.current = [];
      selectedMeshRef.current = null;
    };
  }, [starData]);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current)
        return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const createStars = (THREE: any, scene: any) => {
    if (starData.length === 0) return;

    const STAR_COLOR = 0x3b82f6;
    const STAR_SIZE = 3;

    starData.forEach((starDataItem) => {
      const { x, y, z } = starDataItem.position;

      const geometry = new THREE.SphereGeometry(STAR_SIZE * 0.5, 8, 8);

      const material = new THREE.MeshBasicMaterial({
        color: STAR_COLOR,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });

      const starMesh = new THREE.Mesh(geometry, material);
      starMesh.position.set(x, y, z);

      starMesh.userData = {
        issueNumber: starDataItem.issueNumber,
        description: starDataItem.description,
        commit: starDataItem.commit,
        createdAt: starDataItem.createdAt,
        position: starDataItem.position,
      };

      scene.add(starMesh);
      starsRef.current.push(starMesh);

      const glowGeometry = new THREE.SphereGeometry(STAR_SIZE * 0.8, 8, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: STAR_COLOR,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.set(x, y, z);
      glowMesh.userData = starMesh.userData;
      scene.add(glowMesh);
      starsRef.current.push(glowMesh);
    });
  };

  const createBackgroundParticles = (THREE: any, scene: any) => {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 500;
      const y = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      positions.push(x, y, z);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );

    const material = new THREE.PointsMaterial({
      size: 0.5,
      color: 0x888888,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    starsRef.current.push(particles);
  };

  const setupControls = (
    THREE: any,
    domElement: HTMLElement,
    camera: any,
    scene: any,
  ) => {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const checkHover = (mouseX: number, mouseY: number) => {
      if (!raycasterRef.current || !starsRef.current.length) {
        domElement.style.cursor = "default";
        return;
      }

      const raycaster = raycasterRef.current;
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(starsRef.current);
      domElement.style.cursor = intersects.length > 0 ? "pointer" : "default";
    };

    domElement.addEventListener("mousedown", (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    domElement.addEventListener("mousemove", (e: MouseEvent) => {
      const rect = domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current = { x, y };

      checkHover(x, y);

      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      scene.rotation.y += deltaX * 0.005;
      scene.rotation.x += deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    domElement.addEventListener("mouseup", () => {
      isDragging = false;
    });

    domElement.addEventListener("mouseleave", () => {
      isDragging = false;
      domElement.style.cursor = "default";
    });

    domElement.addEventListener("wheel", (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
      const zoomSpeed = 0.1;

      camera.position.z += delta * zoomSpeed;
      camera.position.z = Math.max(
        CONFIG.minDistance,
        Math.min(CONFIG.maxDistance, camera.position.z),
      );
    });
  };

  const setupClickDetection = (
    THREE: any,
    domElement: HTMLElement,
    camera: any,
    scene: any,
  ) => {
    const resetSelectionVisual = () => {
      if (selectionRingRef.current) {
        scene.remove(selectionRingRef.current);
        if (selectionRingRef.current.geometry) {
          selectionRingRef.current.geometry.dispose();
        }
        if (selectionRingRef.current.material) {
          selectionRingRef.current.material.dispose();
        }
        selectionRingRef.current = null;
      }

      if (selectedMeshRef.current) {
        selectedMeshRef.current.scale.set(1, 1, 1);
        selectedMeshRef.current = null;
      }
      targetScaleRef.current = 1;
    };

    const applySelectionVisual = (starMesh: any) => {
      resetSelectionVisual();

      selectedMeshRef.current = starMesh;
      targetScaleRef.current = CONFIG.selectionScaleMultiplier;

      const ringRadius = (starMesh.geometry?.radius || 1.5) * 2.5;
      const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.2, 8, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      const selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);

      selectionRing.position.set(
        starMesh.position.x,
        starMesh.position.y,
        starMesh.position.z,
      );

      scene.add(selectionRing);
      selectionRingRef.current = selectionRing;
    };

    domElement.addEventListener("click", (e: MouseEvent) => {
      if (!raycasterRef.current || !starsRef.current.length) return;

      const raycaster = raycasterRef.current;
      const mouse = mouseRef.current;

      raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);
      const intersects = raycaster.intersectObjects(starsRef.current);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        const starMesh = intersect.object as THREE.Mesh;

        if (starMesh.userData && starMesh.userData.issueNumber) {
          applySelectionVisual(starMesh);

          const selectedStarData: StarData = {
            issueNumber: starMesh.userData.issueNumber,
            description: starMesh.userData.description,
            commit: starMesh.userData.commit,
            createdAt: starMesh.userData.createdAt,
            position: {
              x: starMesh.position.x,
              y: starMesh.position.y,
              z: starMesh.position.z,
            },
          };
          setSelectedStar(selectedStarData);
        }
      } else {
        resetSelectionVisual();
        setSelectedStar(null);
      }
    });
  };

  const animate = (THREE: any, scene: any, camera: any, renderer: any) => {
    const animationLoop = () => {
      if (sceneRef.current) {
        sceneRef.current.rotation.y += CONFIG.rotationSpeed;
      }

      if (selectedMeshRef.current) {
        const mesh = selectedMeshRef.current;
        const currentScale = mesh.scale.x;
        const targetScale = targetScaleRef.current;

        const newScale =
          currentScale +
          (targetScale - currentScale) * CONFIG.selectionAnimationSpeed;

        if (Math.abs(newScale - currentScale) > 0.001) {
          mesh.scale.set(newScale, newScale, newScale);
        }

        if (selectionRingRef.current) {
          selectionRingRef.current.rotation.z += 0.01;
          selectionRingRef.current.rotation.x += 0.005;
        }
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animationLoop);
    };

    animationRef.current = requestAnimationFrame(animationLoop);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const clearSelection = () => {
    if (selectionRingRef.current && sceneRef.current) {
      sceneRef.current.remove(selectionRingRef.current);
      if (selectionRingRef.current.geometry) {
        selectionRingRef.current.geometry.dispose();
      }
      if (selectionRingRef.current.material) {
        selectionRingRef.current.material.dispose();
      }
      selectionRingRef.current = null;
    }

    if (selectedMeshRef.current) {
      selectedMeshRef.current.scale.set(1, 1, 1);
      selectedMeshRef.current = null;
    }
    targetScaleRef.current = 1;

    setSelectedStar(null);
  };

  return (
    <div className="relative h-full">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={fetchData}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg p-2 text-white transition-all"
          title="Refresh Galaxy"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg p-2 text-white transition-all"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>
      </div>

      <div ref={containerRef} className="w-full h-full" />

      {selectedStar && (
        <StarDetailModal star={selectedStar} onClose={clearSelection} />
      )}

      <div className="absolute bottom-4 right-4 z-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
        <div className="text-xs font-semibold text-white mb-2">Controls</div>
        <div className="text-xs text-white/70">
          Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  );
}
