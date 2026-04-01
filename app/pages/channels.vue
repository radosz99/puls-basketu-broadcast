<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <div class="bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
      <h1 class="text-xl font-bold">Zarządzanie kanałami</h1>
      <button
        @click="handleLogout"
        class="text-sm hover:text-gray-300"
      >
        Wyloguj
      </button>
    </div>

    <div v-if="loading" class="p-6 text-center">
      Ładowanie kanałów...
    </div>

    <div v-else class="p-6 max-w-6xl mx-auto">
      <!-- Create Channel Form -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">Utwórz nowy kanał</h2>
        <form @submit.prevent="handleCreateChannel" class="space-y-4">
          <div class="flex gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">ID kanału (slug)</label>
              <input
                v-model="newChannel.channelId"
                type="text"
                required
                placeholder="np. test-kanal"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Nazwa operatora</label>
              <input
                v-model="newChannel.operatorName"
                type="text"
                required
                placeholder="np. Testowy Kanał"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div v-if="createError" class="text-red-600 text-sm">
            {{ createError }}
          </div>

          <button
            type="submit"
            :disabled="creating"
            class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ creating ? 'Tworzenie...' : 'Utwórz kanał' }}
          </button>
        </form>

        <!-- Show generated key -->
        <div v-if="generatedKey" class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-yellow-800">⚠️ Wygenerowano klucz transmisji</div>
            <div class="text-sm text-yellow-700 font-medium">
              Ukryje się za {{ keyExpiresIn }}s
            </div>
          </div>
          <div class="bg-white p-3 rounded border border-yellow-300 font-mono text-sm break-all mb-2">
            {{ generatedKey }}
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="copyKeyToClipboard"
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              📋 Kopiuj klucz
            </button>
            <div class="text-sm text-yellow-700">
              Klucz ukryje się automatycznie po 60 sekundach
            </div>
          </div>
        </div>
      </div>

      <!-- Channels List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID kanału</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nazwa operatora</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktywny</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="channel in channels" :key="channel.id">
              <td class="px-6 py-4 text-sm font-mono">{{ channel.channel_id }}</td>
              <td class="px-6 py-4 text-sm">{{ channel.operator_name }}</td>
              <td class="px-6 py-4 text-sm">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="channel.online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ channel.online ? 'Online' : 'Offline' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                {{ channel.is_active ? 'Tak' : 'Nie' }}
              </td>
              <td class="px-6 py-4 text-sm space-x-3">
                <button
                  @click="handleRegenerateKey(channel)"
                  class="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Wygeneruj nowy klucz
                </button>
                <button
                  @click="handleShowEvents(channel)"
                  class="text-green-600 hover:text-green-800 text-sm"
                >
                  Wydarzenia
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="channels.length === 0" class="p-6 text-center text-gray-500">
          Nie znaleziono kanałów
        </div>
      </div>

      <!-- Events Modal -->
      <div v-if="showEventsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6" @click="closeEventsModal">
        <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden" @click.stop>
          <!-- Modal Header -->
          <div class="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
            <h2 class="text-xl font-bold">
              Wydarzenia - {{ selectedChannel?.channel_id }}
            </h2>
            <button @click="closeEventsModal" class="text-white hover:text-gray-300 text-2xl">
              &times;
            </button>
          </div>

          <!-- Filters -->
          <div class="p-4 bg-gray-50 border-b flex gap-4 items-center">
            <div>
              <label class="text-sm font-medium text-gray-700 mr-2">Akcja:</label>
              <select v-model="eventsFilter.action" @change="loadEvents" class="px-3 py-1 border border-gray-300 rounded text-sm">
                <option value="">Wszystkie</option>
                <option value="show">Show</option>
                <option value="hide">Hide</option>
                <option value="update">Update</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 mr-2">Limit:</label>
              <select v-model.number="eventsFilter.limit" @change="loadEvents" class="px-3 py-1 border border-gray-300 rounded text-sm">
                <option :value="50">50</option>
                <option :value="100">100</option>
                <option :value="200">200</option>
                <option :value="500">500</option>
              </select>
            </div>
            <button @click="loadEvents" class="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              Odśwież
            </button>
          </div>

          <!-- Events Content -->
          <div class="overflow-y-auto" style="max-height: calc(90vh - 200px);">
            <div v-if="loadingEvents" class="p-8 text-center text-gray-500">
              Ładowanie wydarzeń...
            </div>

            <div v-else-if="events.length === 0" class="p-8 text-center text-gray-500">
              Brak wydarzeń
            </div>

            <div v-else class="divide-y divide-gray-200">
              <div v-for="event in events" :key="event.triggered_at" class="p-4 hover:bg-gray-50">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span
                        class="px-2 py-1 rounded text-xs font-medium"
                        :class="{
                          'bg-green-100 text-green-800': event.action === 'show',
                          'bg-red-100 text-red-800': event.action === 'hide',
                          'bg-blue-100 text-blue-800': event.action === 'update'
                        }"
                      >
                        {{ event.action.toUpperCase() }}
                      </span>
                      <span class="text-sm font-medium">{{ event.graphic || 'N/A' }}</span>
                      <span
                        class="px-2 py-1 rounded text-xs"
                        :class="event.output_was_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                      >
                        {{ event.output_was_online ? 'Output Online' : 'Output Offline' }}
                      </span>
                    </div>

                    <div class="text-xs text-gray-600 space-y-1">
                      <div class="flex items-center gap-4">
                        <span>{{ formatDateTime(event.triggered_at) }}</span>
                        <span v-if="event.geo_data">
                          {{ event.geo_data.city_name || 'Unknown' }}, {{ event.geo_data.country_code || 'N/A' }}
                          ({{ event.geo_data.ip_address }})
                        </span>
                        <span>User ID: {{ event.triggered_by_user_id }}</span>
                      </div>

                      <div v-if="event.payload && Object.keys(event.payload).length > 0" class="mt-2">
                        <details class="text-xs">
                          <summary class="cursor-pointer text-blue-600 hover:text-blue-800">Payload</summary>
                          <pre class="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">{{ JSON.stringify(event.payload, null, 2) }}</pre>
                        </details>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="events.length > 0" class="p-4 bg-gray-50 border-t flex items-center justify-between">
            <button
              @click="loadPreviousPage"
              :disabled="eventsFilter.skip === 0"
              class="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              ← Poprzednia
            </button>
            <span class="text-sm text-gray-600">
              Wyświetlono {{ eventsFilter.skip + 1 }} - {{ eventsFilter.skip + events.length }}
            </span>
            <button
              @click="loadNextPage"
              :disabled="events.length < eventsFilter.limit"
              class="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Następna →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const auth = useAuth()
const api = useApi()

const loading = ref(true)
const channels = ref<any[]>([])
const creating = ref(false)
const createError = ref('')
const generatedKey = ref('')
const keyExpiresIn = ref(0)
let keyExpiryTimer: NodeJS.Timeout | null = null

const newChannel = ref({
  channelId: '',
  operatorName: ''
})

// Events modal
const showEventsModal = ref(false)
const selectedChannel = ref<any>(null)
const events = ref<any[]>([])
const loadingEvents = ref(false)
const eventsFilter = ref({
  action: '',
  limit: 100,
  skip: 0
})

function startKeyExpiryTimer() {
  // Clear any existing timer
  if (keyExpiryTimer) {
    clearInterval(keyExpiryTimer)
  }

  keyExpiresIn.value = 60

  // Countdown timer
  keyExpiryTimer = setInterval(() => {
    keyExpiresIn.value--

    if (keyExpiresIn.value <= 0) {
      generatedKey.value = ''
      keyExpiresIn.value = 0
      if (keyExpiryTimer) {
        clearInterval(keyExpiryTimer)
        keyExpiryTimer = null
      }
    }
  }, 1000)
}

function copyKeyToClipboard() {
  if (generatedKey.value) {
    navigator.clipboard.writeText(generatedKey.value)
    alert('Klucz skopiowany do schowka!')
  }
}

async function loadChannels() {
  try {
    const data = await api.get('/api/v1/broadcast/channels')
    channels.value = data

    // Load online status for each channel
    for (const channel of channels.value) {
      try {
        const status = await api.get(`/api/v1/broadcast/channels/${channel.id}/status`)
        channel.online = status.online
      } catch (err) {
        channel.online = false
      }
    }
  } catch (err: any) {
    console.error('Failed to load channels:', err)
  }
}

async function handleCreateChannel() {
  creating.value = true
  createError.value = ''
  generatedKey.value = ''

  try {
    const response = await api.post('/api/v1/broadcast/channels', {
      channel_id: newChannel.value.channelId,
      operator_name: newChannel.value.operatorName
    })

    // Show the generated key
    if (response.broadcast_key) {
      generatedKey.value = response.broadcast_key
      startKeyExpiryTimer()
    }

    // Reset form
    newChannel.value = {
      channelId: '',
      operatorName: ''
    }

    // Reload channels
    await loadChannels()
  } catch (err: any) {
    createError.value = err.message || 'Nie udało się utworzyć kanału'
  } finally {
    creating.value = false
  }
}

async function handleRegenerateKey(channel: any) {
  if (!confirm('Czy na pewno chcesz wygenerować nowy klucz transmisji? Stary klucz przestanie działać.')) {
    return
  }

  try {
    const response = await api.post(`/api/v1/broadcast/channels/${channel.channel_id}/regenerate-key`)

    if (response.broadcast_key) {
      generatedKey.value = response.broadcast_key
      startKeyExpiryTimer()

      // Scroll to the key display
      await nextTick()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } catch (err: any) {
    alert('Nie udało się wygenerować klucza: ' + err.message)
  }
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

async function handleShowEvents(channel: any) {
  selectedChannel.value = channel
  showEventsModal.value = true
  eventsFilter.value = {
    action: '',
    limit: 100,
    skip: 0
  }
  await loadEvents()
}

function closeEventsModal() {
  showEventsModal.value = false
  selectedChannel.value = null
  events.value = []
}

async function loadEvents() {
  if (!selectedChannel.value) return

  loadingEvents.value = true
  try {
    const params = new URLSearchParams()
    params.append('limit', eventsFilter.value.limit.toString())
    params.append('skip', eventsFilter.value.skip.toString())
    if (eventsFilter.value.action) {
      params.append('action', eventsFilter.value.action)
    }

    const data = await api.get(`/api/v1/broadcast/channels/${selectedChannel.value.channel_id}/events?${params.toString()}`)
    events.value = data || []
  } catch (err: any) {
    console.error('Failed to load events:', err)
    events.value = []
  } finally {
    loadingEvents.value = false
  }
}

function loadNextPage() {
  eventsFilter.value.skip += eventsFilter.value.limit
  loadEvents()
}

function loadPreviousPage() {
  eventsFilter.value.skip = Math.max(0, eventsFilter.value.skip - eventsFilter.value.limit)
  loadEvents()
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(async () => {
  // Check authentication
  if (!auth.isAuthenticated()) {
    router.push('/login')
    return
  }

  try {
    // Check if user is super_admin
    const user = await api.get('/api/v1/auth/users/me')

    if (user.role !== 'super_admin') {
      router.push('/')
      return
    }

    await loadChannels()
    loading.value = false
  } catch (err: any) {
    console.error('Failed to load:', err)
    router.push('/login')
  }
})

onUnmounted(() => {
  if (keyExpiryTimer) {
    clearInterval(keyExpiryTimer)
    keyExpiryTimer = null
  }
})
</script>
