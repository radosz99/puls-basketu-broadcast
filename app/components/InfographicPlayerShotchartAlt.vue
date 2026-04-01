<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  gameId: {
    type: Number,
    required: true
  },
  shirtNumber: {
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

// Combine players from both teams
const allPlayers = computed(() => {
    if (!gameData.value) return []
    const homePlayers = gameData.value.home_team?.players || []
    const awayPlayers = gameData.value.away_team?.players || []
    return [...homePlayers, ...awayPlayers]
})

// Get selected player based on props
const selectedPlayer = computed(() => {
    if (!gameData.value || !allPlayers.value.length) return null

    // Map team prop to team name
    let targetTeamName = null
    if (props.team === 'home' && gameData.value.home_team) {
        targetTeamName = gameData.value.home_team.name
    } else if (props.team === 'away' && gameData.value.away_team) {
        targetTeamName = gameData.value.away_team.name
    }

    // Find player by shirt_number and team
    if (props.shirtNumber !== null) {
        const player = allPlayers.value.find(p => {
            const matchesNumber = parseInt(p.shirt_number) === props.shirtNumber
            const matchesTeam = !targetTeamName || p.team_name === targetTeamName
            return matchesNumber && matchesTeam
        })
        if (player) return player
    }

    // Fallback: find highest eval player from team
    let candidates = allPlayers.value
    if (targetTeamName) {
        candidates = allPlayers.value.filter(p => p.team_name === targetTeamName)
    }

    if (candidates.length === 0) return allPlayers.value[0]

    return candidates.reduce((best, current) => {
        const bestEval = best.stat_line?.eval || -999
        const currentEval = current.stat_line?.eval || -999
        return currentEval > bestEval ? current : best
    }, candidates[0])
})

// Filter shots by selected player
const playerShots = computed(() => {
    if (!shotsData.value || !Array.isArray(shotsData.value) || !selectedPlayer.value) return []
    return shotsData.value.filter(shot => shot.player_full_name === selectedPlayer.value.name)
})

const playerImageUrl = computed(() => {
    if (!selectedPlayer.value?.server_image_url) {
        return '/transparent-player-placeholder.png'
    }
    return selectedPlayer.value.server_image_url
})

const playerTeamLogoUrl = computed(() => {
    if (!gameData.value || !selectedPlayer.value?.team_name) {
        return '/transparent-player-placeholder.png'
    }

    const playerTeamName = selectedPlayer.value.team_name
    let logoUrl = null

    if (gameData.value.home_team?.name === playerTeamName) {
        logoUrl = gameData.value.home_team.server_logo_url
    } else if (gameData.value.away_team?.name === playerTeamName) {
        logoUrl = gameData.value.away_team.server_logo_url
    }

    if (!logoUrl) {
        return '/transparent-player-placeholder.png'
    }

    return logoUrl
})

const addCacheBuster = (url) => {
    if (!url) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}`
}

const playerNameFontSize = computed(() => {
    if (!selectedPlayer.value?.name) return '1.75rem'
    const nameLength = selectedPlayer.value.name.length
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
        console.error('[InfographicPlayerShotchart] Failed to fetch data:', error)
    } finally {
        loading.value = false
    }
}

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
                    return
                }

                if (shotchart3DRef.value?.courtRef3D &&
                    typeof shotchart3DRef.value.courtRef3D.transitionToPosition === 'function') {

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
        <div v-if="isVisible" class="infographic-root"
             :class="{ 'transparent-bg': transparentBg }"
             data-infographic-root="1">

            <!-- Dark Background Overlay -->
            <div v-if="!transparentBg" class="dark-overlay"></div>

            <template v-if="selectedPlayer && playerShots">

            <!-- Top Section: Title with layered bars -->
            <div class="title-section">
                <!-- Foreground layer (textured with text) -->
                <div v-if="animationStarted" class="title-fg-layer">
                    <h2 class="title-text">Mapa rzutów w całym meczu</h2>
                </div>
            </div>

            <!-- Player Section: Name bar -->
            <div class="player-section">
                <!-- Player name bar -->
                <div v-if="animationStarted" class="player-bar">
                    <span class="player-number">#{{ selectedPlayer.shirt_number }}</span>
                    <img :src="addCacheBuster(playerTeamLogoUrl)"
                         :alt="selectedPlayer.team_name"
                         class="team-logo-in-bar" />
                    <img :src="addCacheBuster(playerImageUrl)"
                         :alt="selectedPlayer.name"
                         class="player-image-in-bar" />
                    <h1 class="player-name" :style="{ fontSize: playerNameFontSize }">
                        {{ selectedPlayer.name }}
                    </h1>
                </div>
            </div>

            <!-- Shotchart -->
            <div v-if="animationStarted" class="shotchart-container">
                <div class="shotchart-wrapper" :class="{ 'shotchart-3d': use3D, 'transparent': transparentBg }">
                    <Shotchart3D
                        v-if="use3D"
                        ref="shotchart3DRef"
                        :shots="playerShots"
                        :dark-mode="true"
                        :show-control-panel="false"
                        :transparent="false"
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

/* Player Section */
.player-section {
    position: absolute;
    top: 110px;
    left: 0;
    width: 100%;
}

.player-bar {
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

.player-number {
    color: white;
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
    font-size: 45px;
    flex-shrink: 0;
}

.team-logo-in-bar {
    width: 55px;
    height: 55px;
    object-fit: contain;
    flex-shrink: 0;
}

.player-image-in-bar {
    width: 55px;
    height: 55px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.player-name {
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
