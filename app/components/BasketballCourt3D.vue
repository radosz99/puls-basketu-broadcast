<template>
    <div class="basketball-court-3d w-full h-full flex relative">
      <!-- Expandable Left Control Panel -->
      <div
        v-if="showControlPanel"
        class="control-panel h-full transition-all duration-300 ease-in-out relative z-10 overflow-hidden"
        :class="[
          isControlPanelExpanded
            ? 'w-80'
            : 'w-0'
        ]"
      >
        <div class="h-full w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white overflow-y-auto shadow-2xl">
          <!-- Panel Header -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-bold text-center">3D Camera Controls</h3>
          </div>
          
          <!-- Controls Content -->
          <div class="p-4 space-y-6">
            <!-- Distance Control -->
            <div class="space-y-2">
              <label class="text-sm font-semibold block">Distance: {{ distance }}</label>
              <input 
                type="range" 
                v-model.number="distance" 
                min="20" 
                max="100" 
                step="2" 
                @input="updateCamera"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              >
            </div>
            
            <!-- Height Control -->
            <div class="space-y-2">
              <label class="text-sm font-semibold block">Height: {{ height }}</label>
              <input 
                type="range" 
                v-model.number="height" 
                min="5" 
                max="80" 
                step="2" 
                @input="updateCamera"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              >
            </div>
            
            <!-- Angle Control -->
            <div class="space-y-2">
              <label class="text-sm font-semibold block">Angle (°): {{ Math.round(angle) }}</label>
              <input 
                type="range" 
                v-model.number="angle" 
                min="0" 
                max="360" 
                step="5" 
                @input="updateCamera"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              >
            </div>
            
            <!-- Tilt Control -->
            <div class="space-y-2">
              <label class="text-sm font-semibold block">Tilt: {{ tilt }}</label>
              <input 
                type="range" 
                v-model.number="tilt" 
                min="-40" 
                max="40" 
                step="2" 
                @input="updateCamera"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              >
            </div>
            
            <!-- FOV Control -->
            <div class="space-y-2">
              <label class="text-sm font-semibold block">FOV: {{ fov }}°</label>
              <input 
                type="range" 
                v-model.number="fov" 
                min="30" 
                max="120" 
                step="5" 
                @input="updateCamera"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              >
            </div>
            
            <!-- Reset Button -->
            <div class="pt-4">
              <button 
                @click="resetCamera" 
                class="w-full px-4 py-3 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white border-none rounded-md cursor-pointer text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-lg"
              >
                Reset View
              </button>
            </div>
            
            <!-- Camera Presets -->
            <div class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label class="text-sm font-semibold block">Camera Presets:</label>
              <div class="space-y-2">
                <button 
                  v-for="(preset, index) in cameraPresets" 
                  :key="index"
                  @click="applyPreset(preset)"
                  class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white border-none rounded-md cursor-pointer text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-lg text-left"
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>
  
          </div>
        </div>
      </div>


      <!-- Toggle Button (Always Visible) -->
      <button
        v-if="showControlPanel"
        @click="toggleControlPanel"
        class="absolute top-4 z-20 w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110"
        :class="[
          isControlPanelExpanded
            ? 'left-[336px]'
            : 'left-4'
        ]"
      >
        <svg 
          class="w-5 h-5 transition-transform duration-200" 
          :class="{ 'rotate-180': isControlPanelExpanded }"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
      
      <!-- 3D Scene Container (Right Side, Full Height) -->
      <div 
        class="flex-1 h-full transition-all duration-300 ease-in-out"
        :class="[
          isControlPanelExpanded 
            ? 'ml-0' 
            : 'ml-0'
        ]"
        ref="containerRef"
      >
        <canvas
          ref="canvasRef"
          class="w-full h-full block"
          :style="{ background: 'transparent', pointerEvents: gameMode ? 'none' : 'auto' }"
        ></canvas>
        <!-- Hidden backboard component for creating 3D objects -->
        <BasketballBackboard
          ref="backboardRef"
          :centerX="0"
          :centerY="0"
          :centerZ="0"
          :logoUrl="advertisingLogo"
          :suzukiLogo="props.suzukiLogo"
          class="hidden"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, watch, computed, markRaw } from 'vue'
  import * as THREE from 'three'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
  
  // Props
  const props = defineProps({
    imageUrl: {
      type: String,
      default: null
    },
    name: {
      type: String,
      default: null
    },
    subname: {
      type: String,
      default: null
    },
    thirdText: {
      type: String,
      default: null
    },
    borderMultiplier: {
      type: Number,
      default: 1.0
    },
    initialDistance: {
      type: Number,
      default: 40
    },
    initialHeight: {
      type: Number,
      default: 35
    },
    initialAngle: {
      type: Number,
      default: 270
    },
    initialTilt: {
      type: Number,
      default: 2
    },
    initialFov: {
      type: Number,
      default: 60
    },
    showControlPanel: {
      type: Boolean,
      default: true
    },
    showFullCourt: {
      type: Boolean,
      default: false
    },
    animateAdvertising: {
      type: Boolean,
      default: true
    },
    showAdvertising: {
    type: Boolean,
    default: true
  },
    transparent: {
      type: Boolean,
      default: false
    },
    gameMode: {
      type: Boolean,
      default: false
    },
    homeTeamName: {
      type: String,
      default: null
    },
    awayTeamName: {
      type: String,
      default: null
    },
    homeTeamLogo: {
      type: String,
      default: null
    },
    awayTeamLogo: {
      type: String,
      default: null
    },
    advertisingLogo: {
      type: String,
      default: 'logo-white-with-name.png'
    },
    advertisingSpeed: {
      type: Number,
      default: 1.0
    },
    suzukiLogo: {
      type: Boolean,
      default: false
    },
    courtOpacity: {
      type: Number,
      default: 1.0
    },
    forceDarkMode: {
      type: Boolean,
      default: false
    }
  })
  
  // Always use dark mode in broadcast
  const isDark = computed(() => true)
  
  // Refs
  const containerRef = ref(null)
  const canvasRef = ref(null)
  const backboardRef = ref(null)
  
  // Video capture mode - prevents resize during export
  const isVideoCapturing = ref(false)
  const videoCaptureSize = ref({ width: 1920, height: 1080 })
  
  // Camera controls - Use props for initial position
  const distance = ref(props.initialDistance)
  const height = ref(props.initialHeight)
  const angle = ref(props.initialAngle)
  const tilt = ref(props.initialTilt)
  const fov = ref(props.initialFov)
  
  // Camera presets
  const cameraPresets = ref([
    {
      name: 'Default (Overview)',
      distance: 22,
      height: 90,
      angle: 270,
      tilt: 37,
      fov: 34
    },
    {
      name: 'Behind Basket',
      distance: 20,
      height: 19,
      angle: 90,
      tilt: -20,
      fov: 90
    },
    {
      name: 'Top View',
      distance: 14,
      height: 45,
      angle: 90,
      tilt: -30,
      fov: 50
    },
    {
      name: 'Side View',
      distance: 30,
      height: 20,
      angle: 180,
      tilt: 0,
      fov: 70
    }
  ])
  
  
  // Three.js objects
  let scene, camera, renderer, controls

  // Animation time tracking for advertising boards
  let animationStartTime = 0
  let currentAnimationTime = 0

  // Camera parameter logging
  let lastLoggedParams = null
  
  // Reactive references to expose to parent components
  const sceneRef = ref(null)
  const cameraRef = ref(null)
  const rendererRef = ref(null)
  
  // Court dimensions - FIBA standard (in feet)
  // Full FIBA court: 28m x 15m, Half court: 14m x 15m
  const courtWidth = 49.21 // 15m in feet
  const halfCourtLength = 45.93 // 14m in feet
  const fullCourtLength = 91.86 // 28m in feet
  const visibleCourtLength = computed(() => props.showFullCourt ? fullCourtLength : halfCourtLength)
  const keyWidth = 16.08 // 4.9m in feet
  const threePointRadius = 22.15 // 6.75m in feet
  const threePointSideRadius = 21.65 // 6.6m in feet (corner distance)
  const threePointCutoffLength = 9
  const freeThrowLineLength = 19.03 // 5.8m in feet
  const freeThrowCircleRadius = 5.905 // 1.8m in feet
  const basketProtrusionLength = 3.5 // ~1.07m in feet
  const basketDiameter = 1.5
  const basketWidth = 6
  const restrictedCircleRadius = 4.1 // 1.25m in feet
  const centerCircleRadius = 5.905 // 1.8m in feet (same as free throw circle)
  
  // Log camera parameters
  const logCameraParameters = () => {
    if (!camera || !controls) return

    const params = {
      // Custom polar coordinates (may be inaccurate after manual dragging)
      distance: distance.value,
      height: height.value,
      angle: angle.value,
      tilt: tilt.value,
      fov: fov.value,
      // Actual camera state (100% reliable)
      cameraPosition: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      },
      cameraTarget: {
        x: controls.target.x,
        y: controls.target.y,
        z: controls.target.z
      }
    }

    // Camera parameters logged (removed for broadcast)
  }

  const updateCamera = () => {
    if (camera) {
      // Convert polar coordinates to cartesian
      const radianAngle = THREE.MathUtils.degToRad(angle.value)
      const centerX = courtWidth / 2
      const centerZ = visibleCourtLength.value / 2

      const x = centerX + distance.value * Math.cos(radianAngle)
      const z = centerZ + distance.value * Math.sin(radianAngle)

      camera.position.set(x, height.value, z)
      camera.lookAt(centerX, tilt.value, centerZ)
      camera.fov = fov.value
      camera.updateProjectionMatrix()

      // Sync OrbitControls target with camera lookAt
      if (controls) {
        controls.target.set(centerX, tilt.value, centerZ)
        controls.update()
      }

      // Log camera parameters
      logCameraParameters()
    }
  }
  
  const resetCamera = () => {
    distance.value = 22
    height.value = 90
    angle.value = 270
    tilt.value = 37
    fov.value = 34
    updateCamera()
  }
  
  // Add transition state
  const isTransitioning = ref(false)
  
  // New function for smooth transitions using polar coordinates
  const transitionToView = (targetDistance, targetHeight, targetAngle, targetTilt, targetFov, duration = 2000) => {
    if (isTransitioning.value) return Promise.resolve()

    isTransitioning.value = true

    const startDistance = distance.value
    const startHeight = height.value
    const startAngle = angle.value
    const startTilt = tilt.value
    const startFov = fov.value

    const startTime = Date.now()

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Use easing function for smooth transition
        const easeProgress = 1 - Math.pow(1 - progress, 3) // ease-out cubic

        // Interpolate all camera parameters
        distance.value = startDistance + (targetDistance - startDistance) * easeProgress
        height.value = startHeight + (targetHeight - startHeight) * easeProgress
        angle.value = startAngle + (targetAngle - startAngle) * easeProgress
        tilt.value = startTilt + (targetTilt - startTilt) * easeProgress
        fov.value = startFov + (targetFov - startFov) * easeProgress

        updateCamera()

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          isTransitioning.value = false
          resolve()
        }
      }

      animate()
    })
  }

  // New function for smooth transitions using ABSOLUTE position (more reliable!)
  const transitionToPosition = (targetPosX, targetPosY, targetPosZ, targetLookX, targetLookY, targetLookZ, targetFov, duration = 2000) => {
    if (isTransitioning.value || !camera || !controls) return Promise.resolve()

    isTransitioning.value = true

    const startPosX = camera.position.x
    const startPosY = camera.position.y
    const startPosZ = camera.position.z
    const startLookX = controls.target.x
    const startLookY = controls.target.y
    const startLookZ = controls.target.z
    const startFov = camera.fov

    const startTime = Date.now()

    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Use easing function for smooth transition
        const easeProgress = 1 - Math.pow(1 - progress, 3) // ease-out cubic

        // Interpolate camera position
        const newPosX = startPosX + (targetPosX - startPosX) * easeProgress
        const newPosY = startPosY + (targetPosY - startPosY) * easeProgress
        const newPosZ = startPosZ + (targetPosZ - startPosZ) * easeProgress

        // Interpolate target position
        const newLookX = startLookX + (targetLookX - startLookX) * easeProgress
        const newLookY = startLookY + (targetLookY - startLookY) * easeProgress
        const newLookZ = startLookZ + (targetLookZ - startLookZ) * easeProgress

        // Interpolate FOV
        const newFov = startFov + (targetFov - startFov) * easeProgress

        // Apply to camera
        camera.position.set(newPosX, newPosY, newPosZ)
        camera.fov = newFov
        camera.updateProjectionMatrix()

        // Apply to controls
        controls.target.set(newLookX, newLookY, newLookZ)
        controls.update()

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          isTransitioning.value = false
          resolve()
        }
      }

      animate()
    })
  }
  
  // Enhanced applyPreset with smooth transition
  const applyPreset = async (preset) => {
    await transitionToView(
      preset.distance,
      preset.height, 
      preset.angle,
      preset.tilt,
      preset.fov,
      1500 // 1.5 second transition
    )
  }
  
  // New function for entering 3D mode with improved cinematic transition
  const enterCinematicMode = async () => {
    // DON'T change positions here - they're already set correctly in the refs
    // Just ensure camera is updated to current ref values
    updateCamera()

    // Small delay to let the initial position settle
    await new Promise(resolve => setTimeout(resolve, 200))

    // Set camera to default position
    angle.value = 270
    height.value = 90
    distance.value = 22
    tilt.value = 37
    fov.value = 34
    updateCamera()
  }
  
  // Add control panel state
  const isControlPanelExpanded = ref(false)
  
  // Toggle control panel
  const toggleControlPanel = () => {
    isControlPanelExpanded.value = !isControlPanelExpanded.value
  }
  
  // Function to create team branding behind baselines
  const createTeamBranding = async (courtGroup) => {
    if (!props.gameMode || (!props.homeTeamLogo && !props.awayTeamLogo)) {
      return
    }

    const BRANDING_CONFIG = {
      logoSize: 12,              // Size of team logo
      floorHeight: 0.15,         // Height above floor
      distanceFromBaseline: 8,   // Distance behind baseline
      logoOffsetX: 10            // Offset to the right of center
    }

    // Helper to create single team branding
    const createSingleTeamBranding = async (logoUrl, zPosition, isAwayTeam = false) => {
      const brandingGroup = new THREE.Group()
      const centerX = courtWidth / 2

      // Add logo if provided - positioned to the right of center
      if (logoUrl) {
        try {
          const texture = await new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader()
            loader.load(logoUrl, resolve, undefined, reject)
          })

          texture.colorSpace = THREE.SRGBColorSpace

          const logoGeometry = new THREE.PlaneGeometry(BRANDING_CONFIG.logoSize, BRANDING_CONFIG.logoSize)
          const logoMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
          })
          const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial)
          // Position logo to the right of center
          logoMesh.position.set(centerX + BRANDING_CONFIG.logoOffsetX, BRANDING_CONFIG.floorHeight, zPosition)
          logoMesh.rotation.x = -Math.PI / 2 // Lay flat on floor

          // Different rotation for away team so it's not upside down
          if (isAwayTeam) {
            logoMesh.rotation.z = 0 // No flip for away team
          } else {
            logoMesh.rotation.z = Math.PI // Flip for home team
          }

          brandingGroup.add(logoMesh)
        } catch (error) {
          console.error('Failed to load team logo:', error)
        }
      }

      return brandingGroup
    }

    // Home team branding (behind far baseline - high Z)
    if (props.homeTeamLogo) {
      const homeZ = fullCourtLength + BRANDING_CONFIG.distanceFromBaseline
      const homeBranding = await createSingleTeamBranding(props.homeTeamLogo, homeZ, false)
      courtGroup.add(homeBranding)
    }

    // Away team branding (behind near baseline - low Z)
    if (props.awayTeamLogo) {
      const awayZ = -BRANDING_CONFIG.distanceFromBaseline
      const awayBranding = await createSingleTeamBranding(props.awayTeamLogo, awayZ, true)
      courtGroup.add(awayBranding)
    }
  }

  // Function to create floor display elements (flat on court)
  const createWallDisplay = async (wallGroup, wallWidth, wallHeight, wallPosition) => {
    if (!props.imageUrl && !props.name && !props.subname && !props.thirdText) {
      return
    }
  
    // 📐 CONFIGURATION VARIABLES - Easy to modify
    const DISPLAY_CONFIG = {
      // Display sizing (now for floor placement)
      displayWidthRatio: 0.5,      // 50% of court width for floor display
      displayDepthRatio: 0.3,      // Depth on the floor
  
      // Image settings
      imageSize: 8,                // Size of image on floor
      imageSpacing: 2,             // Gap between image and text
  
      // Text settings
      nameTextSize: 120,           // Main name font size
      subnameTextSize: 140,        // Subname font size
      thirdTextSize: 70,           // Third text font size (much smaller)
      textPadding: 60,             // Padding inside text area
      textVerticalSpacing: 120,    // Space between name and subname
      thirdTextSpacing: 140,       // Space between subname and third text
      textAreaScale: 1.3,          // Scale up the text area size
  
      // Canvas settings - FIXED ASPECT RATIO
      canvasWidth: 1600,           // Width matches text area aspect ratio
      canvasHeight: 600,           // Height for three lines of text
      pixelRatioMax: 2,            // Reduced for better performance
  
      // Floor positioning
      floorHeight: 0.15,           // Slightly above floor to prevent z-fighting
      floorZ: visibleCourtLength.value + 5, // Position behind baseline
    }
  
    // Layout configuration - image on LEFT, text on RIGHT (when viewed from above)
    const imageSize = DISPLAY_CONFIG.imageSize
    const textAreaWidth = wallWidth * 0.4
  
    // Positioning on floor: spread them out properly
    const centerX = courtWidth / 2
    // Image on the left side, text on the right side
    const imageX = centerX - 10  // 10 units left of center
    const textX = centerX + 10   // 10 units right of center
  
    // Add image if provided
    if (props.imageUrl) {
      try {
        const texture = await new Promise((resolve, reject) => {
          const loader = new THREE.TextureLoader()
          loader.load(
            props.imageUrl,
            (loadedTexture) => {
              resolve(loadedTexture)
            },
            undefined,
            (error) => {
              reject(error)
            }
          )
        })
  
        // Set proper color space for accurate colors
        texture.colorSpace = THREE.SRGBColorSpace
  
        const imageGeometry = new THREE.PlaneGeometry(imageSize, imageSize)
        const imageMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide
        })
        const imageMesh = new THREE.Mesh(imageGeometry, imageMaterial)
        // Position flat on floor behind baseline
        imageMesh.position.set(imageX, DISPLAY_CONFIG.floorHeight, DISPLAY_CONFIG.floorZ)
        imageMesh.rotation.x = -Math.PI / 2 // Rotate 90° to lay flat on floor
        imageMesh.rotation.z = Math.PI // Rotate 180° around Z axis to flip orientation
  
        wallGroup.add(imageMesh)
  
      } catch (error) {
        // Silent error handling
      }
    }
  
    // Create text elements
    if (props.name || props.subname || props.thirdText) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Calculate canvas dimensions
      const pixelRatio = Math.min(window.devicePixelRatio, DISPLAY_CONFIG.pixelRatioMax)
      canvas.width = DISPLAY_CONFIG.canvasWidth * pixelRatio
      canvas.height = DISPLAY_CONFIG.canvasHeight * pixelRatio
  
      // Calculate 3D plane dimensions to match canvas aspect ratio
      const canvasAspectRatio = DISPLAY_CONFIG.canvasWidth / DISPLAY_CONFIG.canvasHeight
      const textPlaneWidth = textAreaWidth * DISPLAY_CONFIG.textAreaScale
      const textPlaneHeight = textPlaneWidth / canvasAspectRatio // Match canvas aspect ratio!
      
      // Scale context to match pixel ratio
      ctx.scale(pixelRatio, pixelRatio)
  
      // Clear canvas - keep transparent
      ctx.clearRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio)
      
      // Text styling with proper sizing for canvas dimensions
      const textColor = isDark.value ? '#ffffff' : '#000000'
      ctx.fillStyle = textColor
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      
      // Enable text antialiasing
      ctx.textRenderingOptimization = 'optimizeQuality'
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      let yOffset = DISPLAY_CONFIG.textPadding
  
      // Draw name (proportionally sized for canvas)
      if (props.name) {
        ctx.font = `bold ${DISPLAY_CONFIG.nameTextSize}px Arial, sans-serif`
        const nameText = props.name.toUpperCase()
        ctx.fillText(nameText, DISPLAY_CONFIG.textPadding, yOffset)
        yOffset += DISPLAY_CONFIG.textVerticalSpacing
      }
  
      // Draw subname (proportionally sized for canvas)
      if (props.subname) {
        ctx.font = `bold ${DISPLAY_CONFIG.subnameTextSize}px Arial, sans-serif`
        const subnameText = props.subname.toUpperCase()
        ctx.fillText(subnameText, DISPLAY_CONFIG.textPadding, yOffset)
        yOffset += DISPLAY_CONFIG.thirdTextSpacing
      }
  
      // Draw third text (smaller size, not bold)
      if (props.thirdText) {
        ctx.font = `${DISPLAY_CONFIG.thirdTextSize}px Arial, sans-serif`
        const thirdTextContent = props.thirdText.toUpperCase()
        ctx.fillText(thirdTextContent, DISPLAY_CONFIG.textPadding, yOffset)
      }
      
      // Create texture from canvas with proper settings
      const textTexture = new THREE.CanvasTexture(canvas)
      textTexture.colorSpace = THREE.SRGBColorSpace
      textTexture.needsUpdate = true
      textTexture.generateMipmaps = false
      textTexture.minFilter = THREE.LinearFilter
      textTexture.magFilter = THREE.LinearFilter
      
      // Create text plane with matching aspect ratio
      const textGeometry = new THREE.PlaneGeometry(textPlaneWidth, textPlaneHeight)
      const textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true,
        alphaTest: 0.01,
        side: THREE.DoubleSide  // Make it visible from both sides
      })
      const textMesh = new THREE.Mesh(textGeometry, textMaterial)
      // Position flat on floor behind baseline
      textMesh.position.set(textX, DISPLAY_CONFIG.floorHeight, DISPLAY_CONFIG.floorZ)
      textMesh.rotation.x = -Math.PI / 2 // Rotate 90° to lay flat on floor
      textMesh.rotation.z = Math.PI // Rotate 180° around Z axis to flip orientation
  
      wallGroup.add(textMesh)
    }
  }
  
  // Initialize Three.js scene
  const initThreeJS = () => {
    if (!containerRef.value || !canvasRef.value) {
      console.error('Missing refs, aborting initThreeJS')
      return
    }

    const container = containerRef.value
    const canvas = canvasRef.value

    // Scene
    scene = new THREE.Scene()
    // Set background based on color mode and transparency
    if (props.transparent) {
      scene.background = null // Transparent background
    } else {
      const backgroundColor = isDark.value ? 0xffffff : 0xffffff // gray-800 in dark, gray-300 in light
      scene.background = new THREE.Color(backgroundColor)
    }
    sceneRef.value = markRaw(scene) // Prevent Vue reactivity on Three.js objects
  
    // Camera
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000)
    cameraRef.value = markRaw(camera) // Prevent Vue reactivity on Three.js objects
    updateCamera()
  
    // Renderer with standard settings
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: props.transparent, // Enable alpha channel for transparency
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
        preserveDrawingBuffer: true, // Allows canvas capture
        premultipliedAlpha: false,
        failIfMajorPerformanceCaveat: false
      })
      renderer.setSize(container.offsetWidth, container.offsetHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Cap at 2 for performance
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.outputColorSpace = THREE.SRGBColorSpace

      // No tone mapping for accurate colors from textures
      renderer.toneMapping = THREE.NoToneMapping

      // Set clear color based on transparency
      if (props.transparent) {
        renderer.setClearColor(0x000000, 0) // Transparent background
      } else {
        // Match the scene background color to avoid white flashing
        const backgroundColor = isDark.value ? 0x1f2937 : 0xd1d5db
        renderer.setClearColor(backgroundColor, 1)
      }
    } catch (error) {
      console.error('Failed to create WebGLRenderer:', error)
      console.error('Captured error:', error)
      throw error
    }

    rendererRef.value = markRaw(renderer) // Prevent Vue reactivity on Three.js objects
  
    // Create court
    createBasketballCourt()
    
    // Add lighting
    addLighting()
  
    // Handle resize
    window.addEventListener('resize', handleResize)
    handleResize()
  
    // Add OrbitControls with better constraints
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.25
    controls.screenSpacePanning = false

    // Disable controls in game mode
    controls.enabled = !props.gameMode

    // Distance constraints - allow closer zoom for better detail view
    controls.minDistance = 8
    controls.maxDistance = 120

    // Vertical angle constraints - prevent going below court or too high
    controls.minPolarAngle = Math.PI / 6  // 30 degrees from top (prevents top-down view)
    controls.maxPolarAngle = Math.PI / 2.2  // Just above horizontal (prevents going below court)

    // Limit how far camera can pan vertically
    controls.minAzimuthAngle = -Infinity // Allow full horizontal rotation
    controls.maxAzimuthAngle = Infinity
  
    // Set target to center of basketball court - match the tilt value
    const courtCenterX = courtWidth / 2
    const courtCenterZ = visibleCourtLength.value / 2
    controls.target.set(courtCenterX, tilt.value, courtCenterZ)
    controls.update()

    // Add change listener to log camera params when user drags
    controls.addEventListener('change', () => {
      // Update refs based on current camera position
      const centerX = courtWidth / 2
      const centerZ = visibleCourtLength.value / 2

      // Calculate distance, angle, height from camera position
      const dx = camera.position.x - centerX
      const dz = camera.position.z - centerZ
      distance.value = Math.sqrt(dx * dx + dz * dz)
      angle.value = THREE.MathUtils.radToDeg(Math.atan2(dz, dx))
      height.value = camera.position.y
      fov.value = camera.fov
      tilt.value = controls.target.y

      // Log the updated parameters
      logCameraParameters()
    })

    // Start render loop
    animate()

    // Log initial camera parameters
    logCameraParameters()
  
    // Attach Three.js objects to canvas as fallback for parent components
    canvas._threeScene = scene
    canvas._threeCamera = camera
    canvas._threeRenderer = renderer
  }
  
  // Watch for gameMode changes to enable/disable controls
  watch(() => props.gameMode, (newGameMode) => {
    if (controls) {
      controls.enabled = !newGameMode
    }
  })

  // Watch for color mode changes and update court colors
  watch(isDark, () => {
    if (scene && renderer) {
      // Update scene background (only if not transparent)
      if (props.transparent) {
        scene.background = null
      } else {
        const backgroundColor = isDark.value ? 0x1f2937 : 0xd1d5db // gray-800 in dark, gray-300 in light
        scene.background = new THREE.Color(backgroundColor)
      }

      // Recreate the court with new colors
      // Remove existing court objects
      const existingCourt = scene.getObjectByName('court-group')
      if (existingCourt) {
        scene.remove(existingCourt)
      }

      // Recreate court with updated colors
      createBasketballCourt()
    }
  })
  
  // Watch for prop changes and recreate the court
  watch([
    () => props.imageUrl,
    () => props.name,
    () => props.subname,
    () => props.thirdText,
    () => props.showFullCourt,
    () => props.homeTeamLogo,
    () => props.awayTeamLogo,
    () => props.homeTeamName,
    () => props.awayTeamName,
    () => props.advertisingLogo,
    () => props.courtOpacity,
    () => props.forceDarkMode
  ], () => {
    if (scene) {
      // Remove existing court objects
      const existingCourt = scene.getObjectByName('court-group')
      if (existingCourt) {
        scene.remove(existingCourt)
      }

      // Recreate court with updated wall display
      createBasketballCourt()
    }
  })
  
  const createBasketballCourt = async () => {
    const courtGroup = new THREE.Group()
    courtGroup.name = 'court-group' // Add name for identification

    // Arena floor - larger plane beneath everything (only if not transparent)
    if (!props.transparent) {
      const arenaFloorSize = 150 // Large enough to extend beyond visible area
      const arenaFloorGeometry = new THREE.PlaneGeometry(arenaFloorSize, arenaFloorSize)
      const arenaFloorMaterial = new THREE.MeshBasicMaterial({
        color: isDark.value ? 0x1f2937 : 0xffffff, // gray-800 in dark, gray-300 in light
        side: THREE.DoubleSide
      })

      const arenaFloorMesh = new THREE.Mesh(arenaFloorGeometry, arenaFloorMaterial)
      arenaFloorMesh.rotation.x = -Math.PI / 2
      arenaFloorMesh.position.set(courtWidth / 2, -0.05, visibleCourtLength.value / 2) // Slightly below court
      courtGroup.add(arenaFloorMesh)
    }

    // Court surface - use consistent BasicMaterial approach (only if not transparent)
    if (true) {
      const courtGeometry = new THREE.PlaneGeometry(courtWidth, visibleCourtLength.value)
      const courtMaterial = new THREE.MeshBasicMaterial({
        color: isDark.value ? 0x1f2937 : 0xf9fafb, // gray-800 in dark, gray-50 in light
        side: THREE.DoubleSide,
        transparent: props.courtOpacity < 1.0,
        opacity: props.courtOpacity
      })

      const courtMesh = new THREE.Mesh(courtGeometry, courtMaterial)
      courtMesh.rotation.x = -Math.PI / 2
      courtMesh.position.set(courtWidth / 2, 0, visibleCourtLength.value / 2)
      courtGroup.add(courtMesh)
    }
  
    // Add advertising boards (LED panels) along sidelines
    const createAdvertisingBoards = async () => {
      const boardConfig = {
        height: 2.5,                 // Height of the board (vertical)
        depth: 0.4,                  // Thickness of the board
        length: visibleCourtLength.value,  // Length along the court
        offset: 1.5,                 // Distance from sideline
      }
  
      const boardGroup = new THREE.Group()
  
      // Create texture with logos and spacing
      let logoTexture = null
      try {
        // First load the logo image
        const logoImage = await new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = `/${props.advertisingLogo}`
        })
  
        // Create canvas with logos and spacing
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
  
        // Calculate dimensions
        const logoAspectRatio = logoImage.width / logoImage.height
        const logoHeight = 512 // Fixed height in pixels
        const logoWidth = logoHeight * logoAspectRatio
        const spacing = logoWidth * 0.5 // 50% spacing between logos
        const tileWidth = logoWidth + spacing
  
        // Canvas size: one tile unit (will be repeated)
        canvas.width = tileWidth
        canvas.height = logoHeight
  
        // Fill with white background
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
  
        // Draw logo (centered vertically, left-aligned)
        ctx.drawImage(logoImage, 0, 0, logoWidth, logoHeight)
  
        // Create texture from canvas
        logoTexture = new THREE.CanvasTexture(canvas)
        logoTexture.wrapS = THREE.RepeatWrapping
        logoTexture.wrapT = THREE.ClampToEdgeWrapping
        logoTexture.colorSpace = THREE.SRGBColorSpace
        logoTexture.needsUpdate = true
  
        // Calculate how many times to repeat
        const desiredLogoHeight = boardConfig.height * 0.8
        const desiredLogoWidth = desiredLogoHeight * logoAspectRatio
        const desiredTileWidth = desiredLogoWidth + (desiredLogoWidth * 0.5)
  
        const repeatX = boardConfig.length / desiredTileWidth
        const repeatY = boardConfig.height / desiredLogoHeight
  
        logoTexture.repeat.set(repeatX, repeatY)
        logoTexture.offset.y = -(repeatY - 1) / 2
  
      } catch (error) {
        console.error('Failed to load logo texture:', error)
      }
  
      // Board background color (white)
      const boardColor = 0xf3f4f6
  
      // Helper to create a single advertising board
      const createBoard = (x, z, rotation = 0) => {
        const geometry = new THREE.BoxGeometry(boardConfig.depth, boardConfig.height, boardConfig.length)
  
        // Create material with texture if available
        const material = new THREE.MeshBasicMaterial({
          color: logoTexture ? boardColor : boardColor, // White tint for texture, color for fallback
          map: logoTexture,
          depthTest: true,
          depthWrite: true
        })
  
        const board = new THREE.Mesh(geometry, material)
        board.position.set(x, boardConfig.height / 2, z)
        board.rotation.y = rotation
        board.renderOrder = 100 // Render advertising boards after shots

        // Store material reference for animation
        board.userData.animatedMaterial = material

        return board
      }
  
      // Left sideline board (continuous)
      const leftBoard = createBoard(-boardConfig.offset, visibleCourtLength.value / 2, 0)
      boardGroup.add(leftBoard)
  
      // Right sideline board (continuous)
      const rightBoard = createBoard(courtWidth + boardConfig.offset, visibleCourtLength.value / 2, 0)
      boardGroup.add(rightBoard)
  
      return boardGroup
    }
  
    if (props.showAdvertising) {
  const advertisingBoards = await createAdvertisingBoards()
  courtGroup.add(advertisingBoards)
}
  
  
    // Create floor display group (text and image on court floor)
    const wallDisplayGroup = new THREE.Group()
    wallDisplayGroup.name = 'floor-display-group'
  
    // Add floor display elements (passing dummy values since we don't use wall position anymore)
    await createWallDisplay(wallDisplayGroup, courtWidth + 4, 12, { x: 0, y: 0, z: 0 })
    courtGroup.add(wallDisplayGroup)

    // Add team branding behind baselines (in game mode)
    await createTeamBranding(courtGroup)
  
    // Line properties - use BasicMaterial for consistency
    const lineColor = isDark.value ? 0xf3f4f6 : 0x1f2937 // gray-100 in dark, gray-600 in light
    // Apply borderMultiplier and increase base line dimensions for better visibility
    const lineHeight = 0.1 * props.borderMultiplier
    const lineWidth = 0.2 * props.borderMultiplier
  
    // Helper function to create straight lines - using BasicMaterial
    const createLine = (x1, z1, x2, z2) => {
      const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
      const geometry = new THREE.BoxGeometry(length, lineHeight, lineWidth)
      const material = new THREE.MeshBasicMaterial({ color: lineColor })
      const line = new THREE.Mesh(geometry, material)
      
      const midX = (x1 + x2) / 2
      const midZ = (z1 + z2) / 2
      line.position.set(midX, lineHeight / 2, midZ)
      // Calculate rotation angle for any line direction
      const angle = Math.atan2(z2 - z1, x2 - x1)
      line.rotation.y = angle
      
      return line
    }
  
    // Helper function to create arcs - using BasicMaterial
    const createArc = (centerX, centerZ, radius, startAngle, endAngle, segments = 32) => {
      const points = []
      for (let i = 0; i <= segments; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / segments)
        // Rotate the arc by 90 degrees by swapping sin/cos and adjusting signs
        const x = centerX + radius * Math.sin(angle)
        const z = centerZ - radius * Math.cos(angle)
        points.push(new THREE.Vector3(x, lineHeight / 2, z))
      }
      
      if (points.length > 1) {
        const curve = new THREE.CatmullRomCurve3(points)
        const tubeGeometry = new THREE.TubeGeometry(curve, segments, lineWidth / 2, 8, false)
        const tubeMaterial = new THREE.MeshBasicMaterial({ color: lineColor })
        return new THREE.Mesh(tubeGeometry, tubeMaterial)
      }
      return null
    }
  
    const centerX = courtWidth / 2
    const basketCenterZ = visibleCourtLength.value - basketProtrusionLength - basketDiameter / 2
  
    // Court boundary lines
    courtGroup.add(createLine(0, 0, courtWidth, 0)) // Top border
    courtGroup.add(createLine(0, 0, 0, visibleCourtLength.value)) // Left sideline  
    courtGroup.add(createLine(courtWidth, 0, courtWidth, visibleCourtLength.value)) // Right sideline
    courtGroup.add(createLine(0, visibleCourtLength.value, courtWidth, visibleCourtLength.value)) // Baseline
  
    // Paint/Key area
    const keyLeft = centerX - keyWidth / 2
    const keyRight = centerX + keyWidth / 2
    const freeThrowY = visibleCourtLength.value - freeThrowLineLength
    
    courtGroup.add(createLine(keyLeft, visibleCourtLength.value, keyLeft, freeThrowY)) // Left key line
    courtGroup.add(createLine(keyRight, visibleCourtLength.value, keyRight, freeThrowY)) // Right key line  
    courtGroup.add(createLine(keyLeft - 0.1, freeThrowY, keyRight + 0.1, freeThrowY)) // Free throw line
    courtGroup.add(createLine(keyLeft, visibleCourtLength.value, keyRight, visibleCourtLength.value)) // Top of paint line (baseline)
  
    // Free throw circle (top half solid)
    const ftTopArc = createArc(centerX, freeThrowY, freeThrowCircleRadius, -Math.PI/2, Math.PI/2, 48)
    if (ftTopArc) courtGroup.add(ftTopArc)
    
    // Free throw circle (bottom half dashed)
    for (let i = 0; i < 8; i++) {
      const startAngle = Math.PI/2 + (Math.PI * i / 8)
      const endAngle = Math.PI/2 + (Math.PI * (i + 0.6) / 8)
      if (i % 1 === 0) { // Only draw every other segment for dashed effect
        const dashArc = createArc(centerX, freeThrowY, freeThrowCircleRadius, startAngle, endAngle, 48)
        if (dashArc) courtGroup.add(dashArc)
      }
    }
  
    // Three-point line
    // Calculate where the arc connects to the straight lines
    const shoulderAngle = Math.asin(threePointSideRadius / threePointRadius)
    
    // Three-point arc (curved portion)
    const threePointArc = createArc(
      centerX, 
      basketCenterZ, 
      threePointRadius, 
      -shoulderAngle, // Start angle
      shoulderAngle,  // End angle  
      48
    )
    if (threePointArc) courtGroup.add(threePointArc)
  
    // Three-point straight lines (sides)
    const arcEndZ = basketCenterZ - Math.sqrt(threePointRadius * threePointRadius - threePointSideRadius * threePointSideRadius)
    
    courtGroup.add(createLine(centerX - threePointSideRadius, visibleCourtLength.value, centerX - threePointSideRadius, arcEndZ)) // Left three-point line
    courtGroup.add(createLine(centerX + threePointSideRadius, visibleCourtLength.value, centerX + threePointSideRadius, arcEndZ)) // Right three-point line
  
    // Restricted area arc (small semicircle under basket)
    const restrictedArc = createArc(
      centerX,
      basketCenterZ,
      restrictedCircleRadius,
      -Math.PI/2,
      Math.PI/2,
      32
    )
    if (restrictedArc) courtGroup.add(restrictedArc)

    // Center circle at half court line
    const centerLineZ = props.showFullCourt ? halfCourtLength : 0
    const centerCircle = createArc(
      centerX,
      centerLineZ, // Half court line position
      centerCircleRadius,
      0, // Full circle
      Math.PI * 2,
      128
    )
    if (centerCircle) courtGroup.add(centerCircle)

    // Use the modular backboard component
    if (backboardRef.value) {
      const backboardGroup = backboardRef.value.createBackboard()
      // Position the backboard correctly
      backboardGroup.position.set(centerX, 6.56, visibleCourtLength.value - basketProtrusionLength)
      courtGroup.add(backboardGroup)
    }

    // Draw second half if full court is requested
    if (props.showFullCourt) {
      // Center line across court width
      courtGroup.add(createLine(0, halfCourtLength, courtWidth, halfCourtLength))

      // Mirror basket position for far end
      const basketCenterZ2 = basketProtrusionLength + basketDiameter / 2

      // Paint/Key area for far end
      const freeThrowY2 = freeThrowLineLength

      courtGroup.add(createLine(keyLeft, 0, keyLeft, freeThrowY2)) // Left key line
      courtGroup.add(createLine(keyRight, 0, keyRight, freeThrowY2)) // Right key line
      courtGroup.add(createLine(keyLeft - 0.1, freeThrowY2, keyRight + 0.1, freeThrowY2)) // Free throw line
      courtGroup.add(createLine(keyLeft, 0, keyRight, 0)) // Top of paint line (baseline)

      // Free throw circle (far end - bottom half solid)
      const ftTopArc2 = createArc(centerX, freeThrowY2, freeThrowCircleRadius, Math.PI/2, Math.PI*3/2, 48)
      if (ftTopArc2) courtGroup.add(ftTopArc2)

      // Free throw circle (far end - top half dashed)
      for (let i = 0; i < 8; i++) {
        const startAngle = -Math.PI/2 + (Math.PI * i / 8)
        const endAngle = -Math.PI/2 + (Math.PI * (i + 0.6) / 8)
        if (i % 1 === 0) {
          const dashArc = createArc(centerX, freeThrowY2, freeThrowCircleRadius, startAngle, endAngle, 48)
          if (dashArc) courtGroup.add(dashArc)
        }
      }

      // Three-point arc (far end - curved portion)
      const threePointArc2 = createArc(
        centerX,
        basketCenterZ2,
        threePointRadius,
        Math.PI - shoulderAngle, // Start angle (mirrored)
        Math.PI + shoulderAngle,  // End angle (mirrored)
        48
      )
      if (threePointArc2) courtGroup.add(threePointArc2)

      // Three-point straight lines (far end - sides)
      const arcEndZ2 = basketCenterZ2 + Math.sqrt(threePointRadius * threePointRadius - threePointSideRadius * threePointSideRadius)

      courtGroup.add(createLine(centerX - threePointSideRadius, 0, centerX - threePointSideRadius, arcEndZ2)) // Left three-point line
      courtGroup.add(createLine(centerX + threePointSideRadius, 0, centerX + threePointSideRadius, arcEndZ2)) // Right three-point line

      // Restricted area arc (far end)
      const restrictedArc2 = createArc(
        centerX,
        basketCenterZ2,
        restrictedCircleRadius,
        Math.PI/2,
        Math.PI*3/2,
        48
      )
      if (restrictedArc2) courtGroup.add(restrictedArc2)

      // Second backboard at far end
      if (backboardRef.value) {
        const backboardGroup2 = backboardRef.value.createBackboard()
        backboardGroup2.position.set(centerX, 6.56, basketProtrusionLength)
        backboardGroup2.rotation.y = Math.PI // Rotate 180 degrees to face opposite direction
        courtGroup.add(backboardGroup2)
      }
    }

    scene.add(courtGroup)
  }
  
  // Add lighting
  const addLighting = () => {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)
  
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(25, 50, 25)
    scene.add(directionalLight)
  
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-25, 30, 25)
    scene.add(fillLight)
  }
  
  // Handle resize
  const handleResize = () => {
    if (!containerRef.value || !renderer || !camera) return
  
    // Don't resize during video capture
    if (isVideoCapturing.value) {
      return
    }
  
    const container = containerRef.value
    const width = container.offsetWidth
    const height = container.offsetHeight
  
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  
  // Update advertising board textures based on time
  const updateAdvertisingTextures = (timeMs) => {
    if (props.animateAdvertising && scene) {
      const courtGroup = scene.getObjectByName('court-group')
      if (courtGroup) {
        courtGroup.traverse((child) => {
          if (child.userData.animatedMaterial && child.userData.animatedMaterial.map) {
            // Time-based scrolling: 0.001 per frame at 60 FPS = 0.06 per second
            // At 1000ms (1 second), offset should be ~0.06
            // Multiply by advertisingSpeed to control animation speed
            child.userData.animatedMaterial.map.offset.x = (timeMs * 0.00006 * props.advertisingSpeed) % 1
          }
        })
      }
    }
  }

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate)

    // Update animation time (only used in real-time mode)
    if (animationStartTime === 0) {
      animationStartTime = performance.now()
    }
    currentAnimationTime = performance.now() - animationStartTime

    // Update advertising textures based on time
    updateAdvertisingTextures(currentAnimationTime)

    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }
  
  // Lifecycle
  onMounted(() => {
    initThreeJS()
    // Camera is already positioned at default overview - no need for cinematic entrance
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (renderer) {
      renderer.dispose()
    }
  })
  
  // Manual render for frame-by-frame video generation
  const renderSingleFrame = () => {
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }

  // Set animation time for frame-by-frame rendering
  const setAnimationTime = (timeMs) => {
    currentAnimationTime = timeMs
    updateAdvertisingTextures(timeMs)
  }

  // Expose reactive references for parent components
  defineExpose({
    sceneRef,
    cameraRef,
    rendererRef,
    canvasRef,
    // Video capture controls
    isVideoCapturing,
    videoCaptureSize,
    handleResize,
    angle,
    height,
    distance,
    tilt,
    updateCamera,
    renderSingleFrame,
    setAnimationTime,
    transitionToView,
    transitionToPosition // New: transition by absolute position (more reliable!)
  })
  </script>
  
  <style scoped>
  /* Custom slider styling for better dark/light mode support */
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }
  
  .slider::-webkit-slider-thumb:hover {
    background: #2563eb;
    transform: scale(1.1);
  }
  
  .dark .slider::-webkit-slider-thumb {
    border-color: #374151;
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }
  
  .slider::-moz-range-thumb:hover {
    background: #2563eb;
    transform: scale(1.1);
  }
  
  .dark .slider::-moz-range-thumb {
    border-color: #374151;
  }
  
  .slider::-webkit-slider-track {
    height: 8px;
    border-radius: 4px;
    background: #e5e7eb;
    outline: none;
  }
  
  .dark .slider::-webkit-slider-track {
    background: #4b5563;
  }
  
  .slider::-moz-range-track {
    height: 8px;
    border-radius: 4px;
    background: #e5e7eb;
    outline: none;
    border: none;
  }
  
  .dark .slider::-moz-range-track {
    background: #4b5563;
  }
  
  /* Ensure the component takes full available space */
  .basketball-court-3d {
    min-height: 100vh;
  }
  
  /* Smooth panel transitions */
  .control-panel {
    flex-shrink: 0;
  }
  
  /* Hide scrollbar but keep functionality */
  .control-panel::-webkit-scrollbar {
    width: 4px;
  }
  
  .control-panel::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .control-panel::-webkit-scrollbar-thumb {
    background: #9ca3af;
    border-radius: 2px;
  }
  
  .dark .control-panel::-webkit-scrollbar-thumb {
    background: #6b7280;
  }
  </style>