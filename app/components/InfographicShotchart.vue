<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['team', 'player'].includes(value)
  },
  gameId: {
    type: Number,
    required: true
  },
  team: {
    type: String,
    default: 'home',
    validator: (value) => ['home', 'away'].includes(value)
  },
  shirtNumber: {
    type: Number,
    default: null
  },
  title: {
    type: String,
    default: 'Mapa rzutów w całym meczu'
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

// Use base infographic composable
const { isVisible, animationStarted, show: baseShow, hide: baseHide, startAnimation } = useInfographic()

// Check if game is in progress to determine which endpoints to use
const isLive = computed(() => gameData.value?.in_progress === true)

// Combine players from both teams
const allPlayers = computed(() => {
    if (!gameData.value) return []
    const homePlayers = gameData.value.home_team?.players || []
    const awayPlayers = gameData.value.away_team?.players || []
    return [...homePlayers, ...awayPlayers]
})

// Get the selected team based on team parameter
const selectedTeam = computed(() => {
    if (!gameData.value) return null
    return props.team === 'away' ? gameData.value.away_team : gameData.value.home_team
})

// Get selected player based on props (only for player mode)
const selectedPlayer = computed(() => {
    if (props.mode !== 'player' || !gameData.value || !allPlayers.value.length) return null

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

// Filter shots based on mode
const filteredShots = computed(() => {
    if (!shotsData.value || !Array.isArray(shotsData.value)) return []

    if (props.mode === 'team' && selectedTeam.value) {
        return shotsData.value.filter(shot => shot.team === selectedTeam.value.name)
    } else if (props.mode === 'player' && selectedPlayer.value) {
        return shotsData.value.filter(shot => shot.player_full_name === selectedPlayer.value.name)
    }

    return []
})

const teamLogoUrl = computed(() => {
    if (props.mode === 'team') {
        if (!selectedTeam.value?.logo) {
            return '/transparent-player-placeholder.png'
        }
        return selectedTeam.value.logo
    } else if (props.mode === 'player' && gameData.value && selectedPlayer.value?.team_name) {
        const playerTeamName = selectedPlayer.value.team_name
        let logoUrl = null

        if (gameData.value.home_team?.name === playerTeamName) {
            logoUrl = gameData.value.home_team.server_logo_url
        } else if (gameData.value.away_team?.name === playerTeamName) {
            logoUrl = gameData.value.away_team.server_logo_url
        }

        return logoUrl || '/transparent-player-placeholder.png'
    }

    return '/transparent-player-placeholder.png'
})

const playerImageUrl = computed(() => {
    if (props.mode !== 'player' || !selectedPlayer.value?.server_image_url) {
        return '/transparent-player-placeholder.png'
    }
    return selectedPlayer.value.server_image_url
})

const addCacheBuster = (url) => {
    if (!url) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}`
}

const displayName = computed(() => {
    if (props.mode === 'team' && selectedTeam.value) {
        return selectedTeam.value.name
    } else if (props.mode === 'player' && selectedPlayer.value) {
        return selectedPlayer.value.name
    }
    return ''
})

const nameFontSize = computed(() => {
    if (!displayName.value) return '1.75rem'
    const nameLength = displayName.value.length
    if (nameLength > 35) return '1.5rem'
    if (nameLength > 28) return '1.625rem'
    if (nameLength > 22) return '1.75rem'
    return '1.875rem'
})

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
        console.error('[InfographicShotchart] Failed to fetch data:', error)
    } finally {
        loading.value = false
    }
}

// Custom 3D animation logic for shotchart
const run3DAnimation = async () => {
    if (!use3D.value) return

    const startCameraAnimation = async (attempts = 0) => {
        if (attempts > 20) return

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

// Public methods exposed to parent
const show = async () => {
    await fetchData()
    await baseShow()

    // Start animation using base composable with custom 3D logic
    startAnimation(
        animationSpeed.value,
        () => emit('ready'),
        run3DAnimation
    )
}

const hide = () => {
    baseHide()
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

            <template v-if="(mode === 'team' && selectedTeam) || (mode === 'player' && selectedPlayer)">

            <!-- Top Section: Title with layered bars -->
            <div class="title-section">
                <!-- Foreground layer (textured with text) -->
                <div v-if="animationStarted" class="title-fg-layer">
                    <h2 class="title-text">{{ title }}</h2>
                </div>
            </div>

            <!-- Info Section: Team or Player bar -->
            <div class="info-section">
                <!-- Team mode: Team logo + name -->
                <div v-if="mode === 'team' && animationStarted" class="info-bar">
                    <img :src="addCacheBuster(teamLogoUrl)"
                         :alt="selectedTeam.name"
                         class="team-logo-in-bar" />
                    <h1 class="display-name" :style="{ fontSize: nameFontSize }">
                        {{ displayName }}
                    </h1>
                </div>

                <!-- Player mode: Number + Team logo + Player image + name -->
                <div v-if="mode === 'player' && animationStarted" class="info-bar">
                    <span class="player-number">#{{ selectedPlayer.shirt_number }}</span>
                    <img :src="addCacheBuster(teamLogoUrl)"
                         :alt="selectedPlayer.team_name"
                         class="team-logo-in-bar" />
                    <img :src="addCacheBuster(playerImageUrl)"
                         :alt="selectedPlayer.name"
                         class="player-image-in-bar" />
                    <h1 class="display-name" :style="{ fontSize: nameFontSize }">
                        {{ displayName }}
                    </h1>
                </div>
            </div>

            <!-- Shotchart -->
            <div v-if="animationStarted" class="shotchart-container">
                <div class="shotchart-wrapper" :class="{ 'shotchart-3d': use3D }">
                    <Shotchart3D
                        v-if="use3D"
                        ref="shotchart3DRef"
                        :shots="filteredShots"
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

/* Info Section */
.info-section {
    position: absolute;
    top: 110px;
    left: 0;
    width: 100%;
}

.info-bar {
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

.display-name {
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
