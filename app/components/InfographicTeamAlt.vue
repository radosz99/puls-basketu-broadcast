<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  gameId: {
    type: Number,
    required: true
  },
  team: {
    type: String,
    default: 'home',
    validator: (value) => ['home', 'away'].includes(value)
  },
  speed: {
    type: Number,
    default: 2.0
  },
  showAdvertising: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['ready'])

const apiBase = useApiBase()

const use3D = ref(true)
const showAdvertising = computed(() => props.showAdvertising)
const animationSpeed = computed(() => props.speed)
const teamType = computed(() => props.team)

useHead({
    link: [
        {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;900&display=swap'
        }
    ]
})

// Data refs
const gameData = ref(null)
const shotsData = ref(null)
const loading = ref(false)
const isVisible = ref(false)

// Check if game is in progress to determine which endpoints to use
const isLive = computed(() => gameData.value?.in_progress === true)

// Get the selected team based on teamType parameter
const selectedTeam = computed(() => {
    if (!gameData.value) return null
    return teamType.value === 'away' ? gameData.value.away_team : gameData.value.home_team
})

// Filter shots by selected team
const teamShots = computed(() => {
    if (!shotsData.value || !Array.isArray(shotsData.value)) return []
    return shotsData.value.filter(shot => shot.team === selectedTeam.value?.name)
})

const teamLogoUrl = computed(() => {
    if (!selectedTeam.value?.logo) {
        return '/transparent-player-placeholder.png'
    }
    return selectedTeam.value.logo
})

const addCacheBuster = (url) => {
    if (!url) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}`
}

const teamNameFontSize = computed(() => {
    if (!selectedTeam.value?.name) return '1.75rem'
    const nameLength = selectedTeam.value.name.length
    if (nameLength > 35) return '1.5rem'
    if (nameLength > 28) return '1.625rem'
    if (nameLength > 22) return '1.75rem'
    return '1.875rem'
})

const animationStarted = ref(false)
const shotchart3DRef = ref(null)

// Fetch data
const fetchData = async () => {
    if (!props.gameId) return

    loading.value = true
    try {
        // Fetch game data
        gameData.value = await $fetch(`${apiBase}/api/v1/games/${props.gameId}?with_streak=true`)

        // Fetch shots data
        const endpoint = gameData.value?.in_progress ? 'live-shots' : 'shots'
        shotsData.value = await $fetch(`${apiBase}/api/v1/games/${props.gameId}/${endpoint}`)
    } catch (error) {
        console.error('[InfographicTeamAlt] Failed to fetch data:', error)
    } finally {
        loading.value = false
    }
}

// Watch for prop changes
watch(() => props.gameId, () => {
    fetchData()
}, { immediate: false })

watch(() => props.team, () => {
    // Team changed, just update the computed (no need to refetch)
})

// Animation logic
const startAnimation = () => {
    const root = document.querySelector('[data-infographic-root]')

    // Set CSS animation speed variable
    if (root) {
        root.style.setProperty('--animation-speed', animationSpeed.value.toString())
    }

    setTimeout(() => {
        animationStarted.value = true

        // Start 3D camera animation if using 3D mode
        if (use3D.value) {
            const startCameraAnimation = async (attempts = 0) => {
                if (attempts > 20) {
                    console.warn('Failed to start 3D camera animation after 20 attempts')
                    return
                }

                if (shotchart3DRef.value?.courtRef3D &&
                    typeof shotchart3DRef.value.courtRef3D.transitionToPosition === 'function') {
                    console.log('Starting 3D shotchart camera animation and growth')

                    const cameraTransition = shotchart3DRef.value.courtRef3D.transitionToPosition(
                        24.62, 63.30, 33.81,
                        24.53, 5.00, 68.36,
                        30,
                        2000 * animationSpeed.value
                    )

                    if (shotchart3DRef.value?.animateShotsGrowth) {
                        shotchart3DRef.value.animateShotsGrowth(
                            1800 * animationSpeed.value,
                            300 * animationSpeed.value
                        )
                    }

                    await cameraTransition
                    console.log('🎬 Camera transition complete')
                } else {
                    setTimeout(() => startCameraAnimation(attempts + 1), 100 * animationSpeed.value)
                }
            }

            setTimeout(() => startCameraAnimation(), 1000 * animationSpeed.value)
        }

        setTimeout(() => {
            if (root) root.setAttribute('data-animation-complete', '1')
            // Emit ready event after animation completes
            emit('ready')
        }, 3000 * animationSpeed.value)
    }, 300 * animationSpeed.value)
}

// Public methods exposed to parent
const show = async () => {
    await fetchData()
    await nextTick()
    isVisible.value = true

    await nextTick()
    const root = document.querySelector('[data-infographic-root]')
    if (root) root.setAttribute('data-infographic-ready', '1')

    startAnimation()
}

const hide = () => {
    isVisible.value = false
    animationStarted.value = false
}

defineExpose({
    show,
    hide
})
</script>

<template>
    <Transition name="fade">
        <div v-if="isVisible" class="infographic-root" data-infographic-root="1">

            <!-- Dark Background Overlay -->
            <div class="dark-overlay"></div>

            <template v-if="selectedTeam && teamShots">

            <!-- Top Section: Title with layered bars -->
            <div class="title-section">
                <!-- Foreground layer (textured with text) -->
                <div v-if="animationStarted" class="title-fg-layer">
                    <h2 class="title-text">Mapa rzutów w całym meczu</h2>
                </div>
            </div>

            <!-- Team Section: Name bar -->
            <div class="team-section">
                <!-- Team name bar -->
                <div v-if="animationStarted" class="team-bar">
                    <img :src="addCacheBuster(teamLogoUrl)"
                         :alt="selectedTeam.name"
                         class="team-logo-in-bar" />
                    <h1 class="team-name" :style="{ fontSize: teamNameFontSize }">
                        {{ selectedTeam.name }}
                    </h1>
                </div>
            </div>

            <!-- Shotchart -->
            <div v-if="animationStarted" class="shotchart-container">
                <div class="shotchart-wrapper" :class="{ 'shotchart-3d': use3D }">
                    <Shotchart3D
                        v-if="use3D"
                        ref="shotchart3DRef"
                        :shots="teamShots"
                        :dark-mode="true"
                        :show-control-panel="false"
                        :transparent="true"
                        :initial-distance="40"
                        :initial-height="50"
                        :initial-angle="-90"
                        :initial-tilt="20"
                        :initial-fov="30"
                        :show-advertising="showAdvertising"
                        :suzuki-logo="true"
                        advertising-logo="obl.png"
                        :advertising-speed="2.0"
                        :show-full-court="true"
                        :size-multiplier="4.0"
                        :court-opacity="0.5"
                        :force-dark-mode="true"
                        :enable-growth-animation="true"
                    />
                </div>
            </div>

            </template>
        </div>
    </Transition>
</template>

<style scoped>
* {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.infographic-root {
    position: fixed;
    top: 0;
    left: 0;
    width: 1920px;
    height: 1080px;
    background-color: rgba(0, 0, 0, 0.7);
    overflow: hidden;
}

.infographic-root.transparent-bg {
    background-color: transparent !important;
}

/* Dark Background Overlay */
.dark-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 1920px;
    height: 1080px;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 0;
    pointer-events: none;
}

/* Title Section */
.title-section {
    position: absolute;
    top: 30px;
    left: 0;
    width: 100%;
}

.title-fg-layer {
    position: absolute;
    z-index: 2;
    left: 50%;
    transform: translateX(-50%);
    height: 80px;
    width: max-content;
    min-width: 900px;
    background: #ff0000;
    display: flex;
    align-items: center;
    border-top-left-radius: 30px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
    opacity: 0;
    animation: slideInTitle calc(0.5s * var(--animation-speed, 1)) ease-in-out forwards calc(0.1s * var(--animation-speed, 1));
}

.title-text {
    color: white;
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
    font-size: 42px;
    margin: 0;
    padding-left: 60px;
    padding-right: 60px;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

/* Team Section */
.team-section {
    position: absolute;
    top: 110px;
    left: 0;
    width: 100%;
}

.team-bar {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    height: 65px;
    background: rgba(173, 0, 36, 0.85);
    display: flex;
    align-items: center;
    gap: 20px;
    padding-left: 65px;
    padding-right: 40px;
    width: max-content;
    min-width: 900px;
    max-width: 1000px;
    z-index: 3;
    border-bottom-right-radius: 30px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    opacity: 0;
    animation: slideDown calc(0.6s * var(--animation-speed, 1)) ease-in-out forwards calc(0.2s * var(--animation-speed, 1));
}

.team-logo-in-bar {
    width: 55px;
    height: 55px;
    object-fit: contain;
    flex-shrink: 0;
}

.team-name {
    color: white;
    font-family: 'Montserrat', sans-serif;
    font-weight: 500;
    text-transform: uppercase;
    white-space: nowrap;
    margin: 0;
}

/* Shotchart */
.shotchart-container {
    position: absolute;
    top: 180px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    animation: fadeIn calc(0.8s * var(--animation-speed, 1)) ease-out forwards calc(0.3s * var(--animation-speed, 1));
}

.shotchart-wrapper {
    width: 1920px;
    height: 880px;
    background: transparent;
    box-shadow: none;
}

/* Animations */
@keyframes slideInTitle {
    0% {
        transform: translateX(-50%) translateX(-100%);
        opacity: 0;
    }
    100% {
        transform: translateX(-50%) translateX(0);
        opacity: 1;
    }
}

@keyframes slideDown {
    0% {
        transform: translateX(-50%) translateY(-75px);
        opacity: 0;
    }
    50% {
        opacity: 0;
    }
    100% {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
    }
}

@keyframes fadeIn {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}
</style>
