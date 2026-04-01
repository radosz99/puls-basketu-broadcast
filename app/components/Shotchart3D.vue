<template>
    <div class="w-full h-full relative">
      <div class="shot-3d-container h-full relative">
        <BasketballCourt3D
          ref="courtRef3D"
          class="w-full h-full"
          :initialDistance="initialCameraParams.distance"
          :initialHeight="initialCameraParams.height"
          :initialAngle="initialCameraParams.angle"
          :initialTilt="initialCameraParams.tilt"
          :initialFov="initialCameraParams.fov"
          :showControlPanel="false"
          :showFullCourt="props.showFullCourt || props.gameMode"
          :transparent="props.transparent"
          :showAdvertising="props.showAdvertising"
          :animateAdvertising="props.animateAdvertising"
          :homeTeamName="props.homeTeamName"
          :awayTeamName="props.awayTeamName"
          :homeTeamLogo="props.homeTeamLogo"
          :awayTeamLogo="props.awayTeamLogo"
          :gameMode="props.gameMode"
          :advertisingLogo="props.advertisingLogo"
          :advertisingSpeed="props.advertisingSpeed"
          :suzukiLogo="props.suzukiLogo"
          :court-opacity="props.courtOpacity"
          :force-dark-mode="props.forceDarkMode"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
  import * as THREE from 'three'

  const props = defineProps({
    shots: {
      type: Array,
      default: () => []
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    sizeMultiplier: {
      type: Number,
      default: 1.0
    },
    animate: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      default: 3000
    },
    initialPreset: {
      type: String,
      default: 'Side View'
    },
    finalPreset: {
      type: String,
      default: 'Default (Overview)'
    },
    showFullCourt: {
      type: Boolean,
      default: true
    },
    transparent: {
      type: Boolean,
      default: false
    },
    animateAdvertising: {
      type: Boolean,
      default: true
    },
    showAdvertising: {
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
    },
    enableGrowthAnimation: {
      type: Boolean,
      default: false
    }
  })


  // Always use dark mode in broadcast
  const isDark = computed(() => true)

  // Use computed to make shots reactive to props changes
  const shots = computed(() => props.shots)

  // 3D Refs
  const courtRef3D = ref(null)

  // 3D Three.js objects
  let scene, camera, canvas
  let shotObjects = []

  // Court dimensions
  const courtWidth = 49.21
  const halfCourtLength = 45.93 // 14m in feet
  const fullCourtLength = 91.86 // 28m in feet
  // Force full court when in game mode
  const visibleCourtLength = computed(() => (props.showFullCourt || props.gameMode) ? fullCourtLength : halfCourtLength)

  // Animation state
  const isAnimating = ref(false)
  const animationComplete = ref(false)
  const isReady = ref(false)

  // Camera presets (same as basketball-court-3D.vue)
  const cameraPresets = {
    'Default (Overview)': {
      distance: 22,
      height: 90,
      angle: 270,
      tilt: 37,
      fov: 34
    },
    'Behind Basket': {
      distance: 20,
      height: 19,
      angle: 90,
      tilt: -20,
      fov: 90
    },
    'Top View': {
      distance: 14,
      height: 45,
      angle: 45,
      tilt: -30,
      fov: 50
    },
    'Side View': {
      distance: 45,
      height: 65,
      angle: 270,
      tilt: -10,
      fov: 50
    },
    'Home Basket View': {
      distance: 35,
      height: 55,
      angle: 260,
      tilt: 15,
      fov: 45
    },
    'Away Basket View': {
      distance: 35,
      height: 55,
      angle: 80,
      tilt: 15,
      fov: 45
    },
  }

  // Colors for shots - very bright greens for visibility on dark court
  const madeColor = computed(() => isDark.value ? 0x7FFF00 : 0x16A34A)
  const missColor = computed(() => isDark.value ? 0xEF4444 : 0xDC2626)

  // Compute initial camera parameters from preset
  const initialCameraParams = computed(() => {
    if (props.initialAngle && props.initialHeight && props.initialDistance && props.initialTilt && props.initialFov) {
      return {
        distance: props.initialDistance,
        height: props.initialHeight,
        angle: props.initialAngle,
        tilt: props.initialTilt,
        fov: props.initialFov
      }
    }
    // In game mode, always start with full court overview
    if (props.gameMode) {
      return cameraPresets['Default (Overview)']
    }

    const preset = cameraPresets[props.initialPreset]
    if (!preset) {
      // Fallback to Side View if preset not found
      return cameraPresets['Side View']
    }
    return preset
  })

  // Clear all shot objects from scene
  const clearShotObjects = () => {
    shotObjects.forEach(obj => {
      if (scene) scene.remove(obj)
    })
    shotObjects = []
  }
  
  const create3DShotObjects = () => {
    if (!scene) return

    clearShotObjects()

    const innerRadius = 0.18 * props.sizeMultiplier
    const borderWidth = 0.06 * props.sizeMultiplier
    const outerRadius = innerRadius + borderWidth
    const darkerGreen = isDark.value ? 0x5FBF00 : 0x15803d

    // Create each shot with fill and border together
    shots.value.forEach((shot, index) => {
      const shotGroup = new THREE.Group()
      const shotX = shot.x

      // In game mode, position shots based on team
      let shotZ
      if (props.gameMode && shot.team) {
        // Home team shoots at far basket (high Z), away team at near basket (low Z)
        if (shot.team === props.homeTeamName) {
          shotZ = visibleCourtLength.value - shot.y
        } else {
          shotZ = shot.y
        }
      } else {
        // Default behavior: all shots at far basket
        shotZ = visibleCourtLength.value - shot.y
      }

      const verticalOffset = index * 0.0001

      if (shot.made) {
        // Border circle (larger, darker green) - rendered first
        const borderGeometry = new THREE.CircleGeometry(outerRadius, 32)
        const borderMaterial = new THREE.MeshBasicMaterial({
          color: darkerGreen,
          transparent: false,
          depthTest: false,
          depthWrite: false,
          emissive: darkerGreen,
          emissiveIntensity: 0.3
        })
        const border = new THREE.Mesh(borderGeometry, borderMaterial)
        border.rotation.x = -Math.PI / 2
        border.position.set(shotX, 0.15 + verticalOffset, shotZ)
        border.renderOrder = index * 2 + 1000
        shotGroup.add(border)

        // Fill circle (smaller, bright green) - rendered on top of border
        const fillGeometry = new THREE.CircleGeometry(innerRadius, 32)
        const fillMaterial = new THREE.MeshBasicMaterial({
          color: madeColor.value,
          transparent: false,
          depthTest: false,
          depthWrite: false,
          emissive: madeColor.value,
          emissiveIntensity: 0.5
        })
        const fill = new THREE.Mesh(fillGeometry, fillMaterial)
        fill.rotation.x = -Math.PI / 2
        fill.position.set(shotX, 0.15 + verticalOffset, shotZ)
        fill.renderOrder = index * 2 + 1001
        shotGroup.add(fill)
      } else {
        const lineGeometry1 = new THREE.PlaneGeometry(0.4 * props.sizeMultiplier, 0.07 * props.sizeMultiplier)
        const lineGeometry2 = new THREE.PlaneGeometry(0.4 * props.sizeMultiplier, 0.07 * props.sizeMultiplier)
        const lineMaterial = new THREE.MeshBasicMaterial({
          color: missColor.value,
          transparent: true,
          opacity: 0.9,
          depthTest: false,
          depthWrite: false
        })

        const line1 = new THREE.Mesh(lineGeometry1, lineMaterial)
        line1.rotation.x = -Math.PI / 2
        line1.rotation.z = Math.PI / 4
        line1.position.set(shotX, 0.02 + verticalOffset, shotZ)
        line1.renderOrder = index * 2
        shotGroup.add(line1)

        const line2 = new THREE.Mesh(lineGeometry2, lineMaterial)
        line2.rotation.x = -Math.PI / 2
        line2.rotation.z = -Math.PI / 4
        line2.position.set(shotX, 0.02 + verticalOffset, shotZ)
        line2.renderOrder = index * 2 + 1
        shotGroup.add(line2)
      }

      shotGroup.userData = { shot: shot, index: index }
      shotGroup.name = `shot_${index}`

      // Start with small scale only if growth animation is enabled
      const initialScale = props.enableGrowthAnimation ? 0.2 : 1.0
      shotGroup.scale.set(initialScale, initialScale, initialScale)

      scene.add(shotGroup)
      shotObjects.push(shotGroup)
    })
  }

  // Animate shots growing in place one by one
  const animateShotsGrowth = (duration = 1500, delay = 0) => {
    return new Promise((resolve) => {
      if (shotObjects.length === 0) {
        resolve()
        return
      }

      const totalShots = shotObjects.length
      const singleShotDuration = 200 // Each shot takes 200ms to grow
      const staggerDelay = Math.max(10, (duration - singleShotDuration) / totalShots) // Spread shots over the duration
      const startScale = 0.2 // Start small but visible
      const endScale = 1.0

      shotObjects.forEach((shotGroup, index) => {
        const shotStartTime = delay + (index * staggerDelay)

        setTimeout(() => {
          const startTime = Date.now()
          const endTime = startTime + singleShotDuration

          const animate = () => {
            const now = Date.now()

            if (now >= endTime) {
              shotGroup.scale.set(endScale, endScale, endScale)

              // Resolve when last shot finishes
              if (index === totalShots - 1) {
                resolve()
              }
              return
            }

            const elapsed = now - startTime
            const progress = Math.min(elapsed / singleShotDuration, 1)

            // Ease-out cubic for smooth deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 3)
            const currentScale = startScale + (easeProgress * (endScale - startScale))

            shotGroup.scale.set(currentScale, currentScale, currentScale)

            requestAnimationFrame(animate)
          }

          animate()
        }, shotStartTime)
      })
    })
  }
  
  const getCourtObjects = () => {
    if (courtRef3D.value) {
      if (courtRef3D.value.sceneRef?.value && courtRef3D.value.cameraRef?.value && courtRef3D.value.canvasRef?.value) {
        return {
          scene: courtRef3D.value.sceneRef.value,
          camera: courtRef3D.value.cameraRef.value,
          canvas: courtRef3D.value.canvasRef.value
        }
      }

      const courtElement = courtRef3D.value.$el || courtRef3D.value
      const canvasElement = courtElement?.querySelector('canvas')

      if (canvasElement && canvasElement._threeScene && canvasElement._threeCamera) {
        return {
          scene: canvasElement._threeScene,
          camera: canvasElement._threeCamera,
          canvas: canvasElement
        }
      }
    }
    return null
  }

  // Helper function to convert preset parameters to camera position
  const presetToPosition = (preset) => {
    const centerX = courtWidth / 2
    const centerZ = visibleCourtLength.value / 2

    const radianAngle = THREE.MathUtils.degToRad(preset.angle)
    const x = centerX + preset.distance * Math.cos(radianAngle)
    const z = centerZ + preset.distance * Math.sin(radianAngle)

    return {
      position: new THREE.Vector3(x, preset.height, z),
      target: new THREE.Vector3(centerX, preset.tilt, centerZ),
      fov: preset.fov
    }
  }

  // Animate camera between two presets
  const animateCamera = () => {
    if (!camera || !props.animate || isAnimating.value || animationComplete.value) return

    isAnimating.value = true

    // Get initial and final preset configurations
    const initialPreset = cameraPresets[props.initialPreset]
    const finalPreset = cameraPresets[props.finalPreset]

    if (!initialPreset || !finalPreset) {
      console.error('Invalid camera presets:', props.initialPreset, props.finalPreset)
      isAnimating.value = false
      return
    }

    // Convert presets to positions
    const start = presetToPosition(initialPreset)
    const end = presetToPosition(finalPreset)

    // Set initial camera position and FOV
    camera.position.copy(start.position)
    camera.lookAt(start.target)
    camera.fov = start.fov
    camera.updateProjectionMatrix()

    // Use performance.now() for more accurate timing
    const startTime = performance.now()
    const animDuration = props.duration

    // Track last frame time for consistent frame pacing
    let lastFrameTime = startTime
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / animDuration, 1)

      // Frame limiting for consistent playback
      const timeSinceLastFrame = currentTime - lastFrameTime

      // Only update if enough time has passed (helps with consistency)
      if (timeSinceLastFrame >= frameInterval - 1) {
        lastFrameTime = currentTime

        // Ease out cubic for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3)

        // Interpolate camera position
        camera.position.lerpVectors(start.position, end.position, easeProgress)

        // Interpolate camera target
        const currentTarget = new THREE.Vector3()
        currentTarget.lerpVectors(start.target, end.target, easeProgress)
        camera.lookAt(currentTarget)

        // Interpolate FOV
        camera.fov = start.fov + (end.fov - start.fov) * easeProgress
        camera.updateProjectionMatrix()
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        isAnimating.value = false
        animationComplete.value = true
      }
    }

    requestAnimationFrame(animate)
  }

  // Initialize 3D shots after court is ready
  const init3DShots = async () => {
    await nextTick()

    let attempts = 0
    const maxAttempts = 20

    const waitForCourt = async () => {
      const courtObjects = getCourtObjects()

      if (courtObjects && courtObjects.scene && courtObjects.camera && courtObjects.canvas) {
        return courtObjects
      }

      attempts++
      if (attempts >= maxAttempts) {
        console.error('Failed to get 3D court objects after', maxAttempts, 'attempts')
        return null
      }

      await new Promise(resolve => setTimeout(resolve, 200))
      return waitForCourt()
    }

    const courtObjects = await waitForCourt()
    if (!courtObjects) {
      return
    }

    scene = courtObjects.scene
    camera = courtObjects.camera
    canvas = courtObjects.canvas

    console.log('3D court objects ready for shots')

    create3DShotObjects()

    // Mark as ready - shots are rendered and camera is positioned
    isReady.value = true

    // Don't auto-start animation - wait for parent component to trigger it
    // Parent will call animateCamera() when ready to record
  }
  
  // Watch for changes in shots and re-create shot objects
  watch(shots, () => {
    if (scene) {
      create3DShotObjects()
    }
  }, { deep: true })

  // Lifecycle
  onMounted(() => {
    // Initialize 3D shots
    nextTick(() => {
      init3DShots()
    })
  })

  onUnmounted(() => {
    clearShotObjects()
  })

  // Set camera animation to a specific progress (for frame-by-frame rendering)
  const setAnimationProgress = (progress, timeMs = 0) => {
    if (!camera || progress < 0 || progress > 1) return

    // Get presets
    const initialPreset = cameraPresets[props.initialPreset]
    const finalPreset = cameraPresets[props.finalPreset]

    if (!initialPreset || !finalPreset) return

    // Convert presets to positions
    const start = presetToPosition(initialPreset)
    const end = presetToPosition(finalPreset)

    // Apply easing
    const easeProgress = 1 - Math.pow(1 - progress, 3)

    // Interpolate camera position
    camera.position.lerpVectors(start.position, end.position, easeProgress)

    // Interpolate camera target
    const currentTarget = new THREE.Vector3()
    currentTarget.lerpVectors(start.target, end.target, easeProgress)
    camera.lookAt(currentTarget)

    // Interpolate FOV
    camera.fov = start.fov + (end.fov - start.fov) * easeProgress
    camera.updateProjectionMatrix()

    // Update basketball court advertising board animations
    if (courtRef3D.value && typeof courtRef3D.value.setAnimationTime === 'function') {
      courtRef3D.value.setAnimationTime(timeMs)
    }
  }

  // Simple transition to a view with given parameters
  const transitionToView = (distance, height, angle, tilt, fov, duration = 1000) => {
    if (!courtRef3D.value || !courtRef3D.value.transitionToView) return Promise.resolve()

    return courtRef3D.value.transitionToView(distance, height, angle, tilt, fov, duration)
  }

  // Expose methods for parent components
  defineExpose({
    courtRef3D,
    animateCamera,
    isAnimating,
    animationComplete,
    isReady,
    setAnimationProgress,
    transitionToView,
    animateShotsGrowth
  })
  </script>
  
  <style scoped>
  .shot-3d-container {
    position: relative;
    width: 100%;
    height: 100%;
  }
  </style>