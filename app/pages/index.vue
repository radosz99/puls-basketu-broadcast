<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center">
    <div class="text-xl">Ładowanie...</div>
  </div>

  <div v-else-if="error" class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md max-w-md">
      <div class="text-red-600 text-lg mb-4">{{ error }}</div>
      <button
        @click="handleLogout"
        class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
      >
        Wyloguj
      </button>
    </div>
  </div>

  <div v-else class="min-h-screen flex flex-col bg-gray-100">
    <!-- Status Bar -->
    <div class="bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-2">
          <div
            class="w-3 h-3 rounded-full"
            :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
          ></div>
          <span class="text-sm">Panel: {{ isConnected ? 'Połączony' : 'Rozłączony' }}</span>
        </div>

        <div class="flex items-center space-x-2">
          <div
            class="w-3 h-3 rounded-full"
            :class="previewConnected ? 'bg-green-500' : 'bg-gray-500'"
          ></div>
          <span class="text-sm">Podgląd: {{ previewConnected ? 'Połączony' : 'Nie załadowany' }}</span>
        </div>

        <div class="flex items-center space-x-2">
          <div
            class="w-3 h-3 rounded-full"
            :class="stageOnline ? 'bg-green-500' : 'bg-red-500'"
          ></div>
          <span class="text-sm">
            Stage: {{ stageOnline ? `${outputCount} połączonych` : 'Offline' }}
          </span>
        </div>
      </div>

      <div class="flex items-center space-x-4">
        <div v-if="currentGraphic" class="text-sm">
          Na antenie: <span class="font-bold">{{ currentGraphic }}</span>
        </div>
        <button
          @click="handleLogout"
          class="text-sm hover:text-gray-300"
        >
          Wyloguj
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col lg:flex-row">
      <!-- Control Panel - Left Side -->
      <div class="w-full lg:w-1/2 p-6 overflow-auto">
        <div class="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 class="text-2xl font-bold">Panel kontrolny</h2>

          <!-- Broadcast Key for Preview -->
          <div class="bg-blue-50 border border-blue-200 rounded p-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Klucz transmisji
            </label>
            <input
              v-model="broadcastKey"
              type="text"
              placeholder="Wklej klucz transmisji tutaj..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <div class="text-xs text-gray-600 mt-2 space-y-1">
              <div>URL Stage: <span class="font-mono">{{ stageUrl }}</span></div>
              <div class="text-gray-500">💡 Podgląd ładuje się automatycznie. "Stage" pokazuje rzeczywiste połączenia.</div>
            </div>
          </div>

          <!-- League and Game Selectors -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- League Selector -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Liga</label>
              <select
                v-model="selectedLeague"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option v-for="league in leagues" :key="league.id" :value="league">
                  {{ league.name }}
                </option>
              </select>
            </div>

            <!-- Game Selector -->
            <div ref="gamePickerRef" class="relative">
              <label class="block text-sm font-medium text-gray-700 mb-1">Mecz</label>

            <!-- Selected game or Choose button -->
            <button
              @click="showGamePicker = !showGamePicker"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div v-if="selectedGame" class="flex items-center gap-2 text-sm">
                <span v-if="selectedGame.in_progress" class="relative flex h-2 w-2 flex-shrink-0">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span class="truncate">
                  {{ new Date(selectedGame.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' }) }}
                  {{ selectedGame.home_team.abbr || selectedGame.home_team.name.substring(0, 10) }} -
                  {{ selectedGame.away_team.abbr || selectedGame.away_team.name.substring(0, 10) }}
                  <span v-if="selectedGame.in_progress && selectedGame.comment" class="text-green-600 font-medium ml-1">
                    ({{ selectedGame.comment }})
                  </span>
                </span>
              </div>
              <span v-else class="text-gray-500">Wybierz mecz...</span>
            </button>

            <!-- Dropdown picker -->
            <div
              v-if="showGamePicker"
              class="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto"
            >
              <div v-if="loadingGames" class="p-3 text-sm text-gray-500">Ładowanie meczy...</div>
              <div v-else-if="availableGames.length > 0">
                <div
                  v-for="game in availableGames"
                  :key="game.game_id"
                  @click="selectedGame = game; showGamePicker = false"
                  class="p-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  :class="selectedGame?.game_id === game.game_id ? 'bg-blue-50' : ''"
                >
                  <div class="flex items-center gap-2">
                    <span v-if="game.in_progress" class="relative flex h-2 w-2 flex-shrink-0">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span v-else-if="game.finished" class="text-gray-400 text-xs flex-shrink-0">✓</span>
                    <span v-else class="w-2 flex-shrink-0"></span>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs text-gray-500">
                        {{ new Date(game.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
                      </div>
                      <div class="text-sm font-medium truncate">
                        {{ game.home_team.name }} - {{ game.away_team.name }}
                      </div>
                      <div v-if="game.in_progress && game.comment" class="text-xs text-green-600 font-medium">
                        {{ game.comment }}
                      </div>
                      <div v-else-if="game.finished" class="text-xs text-gray-500">
                        {{ game.home_team.score }} : {{ game.away_team.score }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="p-3 text-sm text-gray-500">Brak dostępnych meczy</div>
            </div>
            </div>
          </div>

          <!-- Graphic Type Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Typ grafiki</label>
            <div class="flex gap-2 flex-wrap">
              <button
                @click="selectedGraphic = 'team-shotchart'"
                class="px-4 py-2 rounded border text-sm"
                :class="selectedGraphic === 'team-shotchart' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              >
                Mapa rzutów drużyny
              </button>
              <button
                @click="selectedGraphic = 'player-shotchart'"
                class="px-4 py-2 rounded border text-sm"
                :class="selectedGraphic === 'player-shotchart' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              >
                Mapa rzutów zawodnika
              </button>
            </div>
          </div>

          <!-- Team Shotchart Controls -->
          <div v-if="selectedGraphic === 'team-shotchart'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Drużyna</label>
              <div v-if="loadingGame" class="text-sm text-gray-500">Ładowanie drużyn...</div>
              <div v-else-if="gameData" class="grid grid-cols-2 gap-2">
                <button
                  @click="team = 'home'"
                  class="px-2 py-2 rounded border flex items-center gap-2 justify-center min-w-0"
                  :class="team === 'home' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                >
                  <img
                    v-if="gameData.home_team?.server_logo_url"
                    :src="gameData.home_team.server_logo_url"
                    :alt="gameData.home_team.name"
                    class="w-6 h-6 object-contain flex-shrink-0"
                  />
                  <span class="truncate text-sm">{{ gameData.home_team?.name || 'Gospodarze' }}</span>
                </button>
                <button
                  @click="team = 'away'"
                  class="px-2 py-2 rounded border flex items-center gap-2 justify-center min-w-0"
                  :class="team === 'away' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                >
                  <img
                    v-if="gameData.away_team?.server_logo_url"
                    :src="gameData.away_team.server_logo_url"
                    :alt="gameData.away_team.name"
                    class="w-6 h-6 object-contain flex-shrink-0"
                  />
                  <span class="truncate text-sm">{{ gameData.away_team?.name || 'Goście' }}</span>
                </button>
              </div>
              <div v-else class="grid grid-cols-2 gap-2">
                <button
                  @click="team = 'home'"
                  class="px-4 py-2 rounded border text-sm"
                  :class="team === 'home' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                >
                  Gospodarze
                </button>
                <button
                  @click="team = 'away'"
                  class="px-4 py-2 rounded border text-sm"
                  :class="team === 'away' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                >
                  Goście
                </button>
              </div>
            </div>
          </div>

          <!-- Player Shotchart Controls -->
          <div v-if="selectedGraphic === 'player-shotchart'" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Drużyna</label>
              <div v-if="loadingGame" class="text-sm text-gray-500">Ładowanie drużyn...</div>
              <div v-else-if="gameData" class="grid grid-cols-2 gap-2">
                <button
                  @click="team = 'home'"
                  class="px-2 py-2 rounded border flex items-center gap-2 justify-center min-w-0"
                  :class="team === 'home' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                >
                  <img
                    v-if="gameData.home_team?.server_logo_url"
                    :src="gameData.home_team.server_logo_url"
                    :alt="gameData.home_team.name"
                    class="w-6 h-6 object-contain flex-shrink-0"
                  />
                  <span class="truncate text-sm">{{ gameData.home_team?.name || 'Gospodarze' }}</span>
                </button>
                <button
                  @click="team = 'away'"
                  class="px-2 py-2 rounded border flex items-center gap-2 justify-center min-w-0"
                  :class="team === 'away' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                >
                  <img
                    v-if="gameData.away_team?.server_logo_url"
                    :src="gameData.away_team.server_logo_url"
                    :alt="gameData.away_team.name"
                    class="w-6 h-6 object-contain flex-shrink-0"
                  />
                  <span class="truncate text-sm">{{ gameData.away_team?.name || 'Goście' }}</span>
                </button>
              </div>
              <div v-else class="grid grid-cols-2 gap-2">
                <button
                  @click="team = 'home'"
                  class="px-4 py-2 rounded border text-sm"
                  :class="team === 'home' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                >
                  Gospodarze
                </button>
                <button
                  @click="team = 'away'"
                  class="px-4 py-2 rounded border text-sm"
                  :class="team === 'away' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
                >
                  Goście
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Zawodnik</label>
              <div v-if="loadingGame" class="text-sm text-gray-500">Ładowanie zawodników...</div>
              <div v-else-if="gameData && filteredPlayers.length > 0" class="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                <div
                  v-for="player in filteredPlayers"
                  :key="player.season_player_id"
                  @click="selectedPlayer = player"
                  class="flex items-center gap-2 p-1.5 rounded border cursor-pointer hover:bg-gray-50 text-sm"
                  :class="selectedPlayer?.season_player_id === player.season_player_id ? 'border-blue-600 bg-blue-50' : 'border-gray-300'"
                >
                  <img
                    :src="player.server_image_url || '/transparent-player-placeholder.png'"
                    :alt="player.name"
                    class="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="font-medium truncate text-xs">#{{ player.shirt_number }} {{ player.name }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-gray-500">Wybierz drużynę aby załadować zawodników</div>
            </div>
          </div>

          <!-- Advanced Section -->
          <div class="border-t pt-4">
            <button
              @click="showAdvanced = !showAdvanced"
              class="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <span>{{ showAdvanced ? '▼' : '▶' }}</span>
              <span>Pokaż zaawansowane</span>
            </button>

            <div v-if="showAdvanced" class="mt-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tytuł</label>
                <input
                  v-model="shotchartTitle"
                  type="text"
                  placeholder="np. Mapa rzutów w całym meczu"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Prędkość animacji: {{ speed.toFixed(1) }}x
                </label>
                <input
                  v-model.number="speed"
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  class="w-full"
                />
              </div>

              <div class="flex items-center">
                <input
                  id="advertising"
                  v-model="showAdvertising"
                  type="checkbox"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label for="advertising" class="ml-2 text-sm font-medium text-gray-700">
                  Pokaż reklamy
                </label>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4 pt-4">
            <button
              @click="handleShow"
              :disabled="!canShow || isBusy"
              class="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              POKAŻ
            </button>
            <button
              @click="handleHide"
              :disabled="isBusy"
              class="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              UKRYJ
            </button>
          </div>

          <!-- Clear All Button -->
          <div class="pt-2">
            <button
              @click="handleClearAll"
              :disabled="isBusy"
              class="w-full bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Wyczyść wszystko
            </button>
          </div>
        </div>
      </div>

      <!-- Preview - Right Side -->
      <div class="w-full lg:w-1/2 p-6">
        <div ref="previewContainerRef" class="bg-gray-900 rounded-lg shadow overflow-hidden" style="aspect-ratio: 16/9; position: relative;">
          <div v-if="broadcastKey" style="width: 100%; height: 100%; overflow: hidden; position: relative;">
            <iframe
              :src="previewUrl"
              title="Stage Preview"
              style="
                width: 1920px;
                height: 1080px;
                border: 0;
                transform-origin: top left;
                position: absolute;
                top: 0;
                left: 0;
              "
              :style="{
                transform: `scale(${previewScale})`
              }"
            ></iframe>
          </div>
          <div v-else class="text-white text-center p-8 flex items-center justify-center h-full">
            <div>
              <div class="text-xl mb-2">Podgląd niedostępny</div>
              <div class="text-sm text-gray-400">Wpisz klucz transmisji aby włączyć podgląd</div>
            </div>
          </div>
        </div>
        <div class="text-center text-sm text-gray-600 mt-2">
          Podgląd (aktualizuje się na żywo)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { leagues } from '~/constants/leagues'

const router = useRouter()
const auth = useAuth()
const api = useApi()
const apiBase = useApiBase()

const loading = ref(true)
const error = ref('')
const channelId = ref<string>('')
const broadcastKey = ref<string>('')
const selectedGraphic = ref<string>('team-shotchart')
const speed = ref(2.0)

// League and games
const selectedLeague = ref<any>(null)
const availableGames = ref<any[]>([])
const loadingGames = ref(false)
const selectedGame = ref<any>(null)

// Shotchart data
const team = ref<string>('home')
const gameData = ref<any>(null)
const loadingGame = ref(false)
const selectedPlayer = ref<any>(null)
const shotchartTitle = ref('Mapa rzutów w całym meczu')
const showAdvertising = ref(true)

// UI state
const isBusy = ref(false)
const showAdvanced = ref(false)
const showGamePicker = ref(false)
const gamePickerRef = ref<HTMLElement | null>(null)

// Preview scaling
const previewContainerRef = ref<HTMLElement | null>(null)
const previewScale = ref(0.5) // Default scale

const updatePreviewScale = () => {
  if (previewContainerRef.value) {
    const containerWidth = previewContainerRef.value.offsetWidth
    const scale = containerWidth / 1920
    previewScale.value = scale
  }
}

// Update scale on window resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', updatePreviewScale)
}

// Available players sorted by eval
const availablePlayers = computed(() => {
  if (!gameData.value) return []
  const homePlayers = gameData.value.home_team?.players || []
  const awayPlayers = gameData.value.away_team?.players || []
  const allPlayers = [...homePlayers, ...awayPlayers]

  // Sort by eval descending
  return allPlayers.sort((a, b) => {
    const evalA = a.stat_line?.eval || 0
    const evalB = b.stat_line?.eval || 0
    return evalB - evalA
  })
})

// Filtered players by selected team
const filteredPlayers = computed(() => {
  if (!gameData.value || !team.value) return []

  const targetTeamName = team.value === 'home'
    ? gameData.value.home_team?.name
    : gameData.value.away_team?.name

  if (!targetTeamName) return []

  return availablePlayers.value.filter(p => p.team_name === targetTeamName)
})

// WebSocket state
const stageOnline = ref(false)
const outputCount = ref(0)
const previewConnected = ref(false)
const currentGraphic = ref<string | null>(null)
const isConnected = ref(false)
let wsConnection: ReturnType<typeof useWebSocket> | null = null

function initWebSocket() {
  wsConnection = useWebSocket({
    channelId: channelId.value,
    role: 'control',
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      console.log('[Panel] WebSocket connected')
    }
  })
  isConnected.value = wsConnection.isConnected.value

  // Watch for connection changes
  watch(wsConnection.isConnected, (val) => {
    isConnected.value = val
  })
}

const previewUrl = computed(() => {
  if (!channelId.value || !broadcastKey.value) return ''
  return `/stage/${channelId.value}?key=${broadcastKey.value}&preview=true`
})

const stageUrl = computed(() => {
  if (!channelId.value || !broadcastKey.value) return 'Enter broadcast key above'
  return `${window.location.origin}/stage/${channelId.value}?key=${broadcastKey.value}`
})

const canShow = computed(() => {
  // Must have at least preview or stage connected
  const hasOutput = previewConnected.value || stageOnline.value

  if (selectedGraphic.value === 'team-shotchart') {
    return hasOutput && selectedGame.value && team.value && shotchartTitle.value.trim()
  } else if (selectedGraphic.value === 'player-shotchart') {
    return hasOutput && selectedGame.value && selectedPlayer.value && shotchartTitle.value.trim()
  }
  return false
})

function handleWebSocketMessage(data: any) {
  // Only log non-ready messages to reduce spam
  if (data.type !== 'ready') {
    console.log('[Panel] Received message:', data)
  }

  if (data.type === 'output_online') {
    stageOnline.value = true
  } else if (data.type === 'output_offline') {
    stageOnline.value = false
  } else if (data.type === 'output_count') {
    // New message from backend - count of real (non-preview) outputs
    outputCount.value = data.count
    stageOnline.value = data.count > 0
  } else if (data.type === 'ready') {
    console.log('[Panel] Graphic ready:', data.graphic)
    currentGraphic.value = data.graphic
  }
}

function handleShow() {
  if (!canShow.value || !wsConnection || isBusy.value) return

  isBusy.value = true

  const command: any = {
    action: 'show',
    graphic: selectedGraphic.value,
    speed: speed.value,
    title: shotchartTitle.value
  }

  if (selectedGraphic.value === 'team-shotchart') {
    command.game_id = selectedGame.value.game_id
    command.team = team.value
    command.show_advertising = showAdvertising.value
  } else if (selectedGraphic.value === 'player-shotchart') {
    command.game_id = selectedGame.value.game_id
    command.shirt_number = parseInt(selectedPlayer.value.shirt_number)
    command.team = selectedPlayer.value.team_name === gameData.value?.home_team?.name ? 'home' : 'away'
    command.show_advertising = showAdvertising.value
  }

  wsConnection.send(command)

  // Re-enable after short delay
  setTimeout(() => {
    isBusy.value = false
  }, 1000)
}

function handleHide() {
  if (!wsConnection || isBusy.value) return

  isBusy.value = true
  wsConnection.send({ action: 'hide' })
  currentGraphic.value = null

  // Re-enable after short delay
  setTimeout(() => {
    isBusy.value = false
  }, 1000)
}

function handleClearAll() {
  if (isBusy.value || !wsConnection) return

  isBusy.value = true

  // Hide all graphics from screen
  wsConnection.send({ action: 'hide' })
  currentGraphic.value = null

  // Re-enable after short delay
  setTimeout(() => {
    isBusy.value = false
  }, 1000)
}

// Fetch games for selected league
const fetchGames = async (silent = false) => {
  if (!selectedLeague.value) {
    availableGames.value = []
    return
  }

  if (!silent) {
    loadingGames.value = true
  }

  try {
    const games = await $fetch(`${apiBase}/api/v1/games/latest?games_number=64&league_id=${selectedLeague.value.id}`)
    const previousGameId = selectedGame.value?.game_id
    availableGames.value = games || []

    // Auto-select first game if none selected or previous game no longer in list
    if (availableGames.value.length > 0) {
      if (!selectedGame.value || !availableGames.value.find(g => g.game_id === previousGameId)) {
        selectedGame.value = availableGames.value[0]
      } else {
        // Update selected game data if it exists (to refresh in_progress status and comment)
        const updatedGame = availableGames.value.find(g => g.game_id === previousGameId)
        if (updatedGame) {
          selectedGame.value = updatedGame
        }
      }
    }
  } catch (error) {
    console.error('[Panel] Failed to fetch games:', error)
    availableGames.value = []
  } finally {
    if (!silent) {
      loadingGames.value = false
    }
  }
}

// Fetch game details when game is selected
const fetchGameDetails = async () => {
  if (!selectedGame.value) {
    gameData.value = null
    return
  }

  loadingGame.value = true
  try {
    gameData.value = await $fetch(`${apiBase}/api/v1/games/${selectedGame.value.game_id}?with_streak=true`)
  } catch (error) {
    console.error('[Panel] Failed to fetch game details:', error)
    gameData.value = null
  } finally {
    loadingGame.value = false
  }
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// Save broadcast key to localStorage when it changes
watch(broadcastKey, async (newKey) => {
  if (channelId.value && newKey) {
    localStorage.setItem(`broadcast_key_${channelId.value}`, newKey)
  }
  // Don't set previewConnected here - let the iframe report its actual status

  // Recalculate preview scale when key changes
  await nextTick()
  updatePreviewScale()
})

// Fetch games when league changes
watch(selectedLeague, () => {
  showGamePicker.value = false
  fetchGames()
})

// Refresh games every 30 seconds
let gamesRefreshInterval: NodeJS.Timeout | null = null

const startGamesRefresh = () => {
  if (gamesRefreshInterval) {
    clearInterval(gamesRefreshInterval)
  }
  gamesRefreshInterval = setInterval(() => {
    fetchGames(true) // Silent refresh
  }, 30000) // 30 seconds
}

const stopGamesRefresh = () => {
  if (gamesRefreshInterval) {
    clearInterval(gamesRefreshInterval)
    gamesRefreshInterval = null
  }
}

// Fetch game details when game changes
watch(selectedGame, () => {
  fetchGameDetails()
})

// Close game picker when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  if (showGamePicker.value && gamePickerRef.value && !gamePickerRef.value.contains(e.target as Node)) {
    showGamePicker.value = false
  }
}

// Auto-select first player when filtered players change
watch(filteredPlayers, (players) => {
  if (players.length > 0) {
    // Reset to first player if current selection is not in filtered list
    if (!selectedPlayer.value || !players.find(p => p.season_player_id === selectedPlayer.value.season_player_id)) {
      selectedPlayer.value = players[0]
    }
  } else {
    selectedPlayer.value = null
  }
})

// Reset selected player when team changes
watch(team, () => {
  if (selectedGraphic.value === 'player-shotchart') {
    selectedPlayer.value = null
  }
})

onMounted(async () => {
  // Set up click outside handler for game picker
  document.addEventListener('click', handleClickOutside)

  // Check authentication
  if (!auth.isAuthenticated()) {
    router.push('/login')
    return
  }

  try {
    // Get current user
    const user = await api.get('/api/v1/auth/users/me')

    // Redirect super_admin to channels page
    if (user.role === 'super_admin') {
      router.push('/channels')
      return
    }

    // Check if user has broadcast role
    if (user.role !== 'broadcast') {
      error.value = 'Access denied. You need a Broadcast role to access this panel.'
      loading.value = false
      return
    }

    // Get channel info for broadcast user
    const channel = await api.get('/api/v1/broadcast/channels/me')
    channelId.value = channel.channel_id

    // Load broadcast key from localStorage if available
    const savedKey = localStorage.getItem(`broadcast_key_${channel.channel_id}`)
    if (savedKey) {
      broadcastKey.value = savedKey
    }

    // Set default league to PLK
    selectedLeague.value = leagues[0]

    // Start games refresh interval
    startGamesRefresh()

    // Listen for preview iframe connection status
    window.addEventListener('message', (event) => {
      if (event.data.type === 'preview_connected') {
        previewConnected.value = true
      } else if (event.data.type === 'preview_disconnected') {
        previewConnected.value = false
      }
    })

    // Initialize and connect WebSocket
    await nextTick()
    initWebSocket()
    wsConnection?.connect()

    // Calculate preview scale
    await nextTick()
    updatePreviewScale()

    loading.value = false
  } catch (err: any) {
    error.value = err.message || 'Failed to load panel'
    loading.value = false
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updatePreviewScale)
  }
  document.removeEventListener('click', handleClickOutside)
  stopGamesRefresh()
})
</script>
