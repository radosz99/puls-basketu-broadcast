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
          <div class="font-bold text-yellow-800 mb-2">⚠️ Wygenerowano klucz transmisji</div>
          <div class="bg-white p-3 rounded border border-yellow-300 font-mono text-sm break-all mb-2">
            {{ generatedKey }}
          </div>
          <div class="text-sm text-yellow-700">
            Skopiuj ten klucz teraz - nie zostanie pokazany ponownie!
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
              <td class="px-6 py-4 text-sm">
                <button
                  @click="handleRegenerateKey(channel.id)"
                  class="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Wygeneruj nowy klucz
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="channels.length === 0" class="p-6 text-center text-gray-500">
          Nie znaleziono kanałów
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

const newChannel = ref({
  channelId: '',
  operatorName: ''
})

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

async function handleRegenerateKey(channelId: number) {
  if (!confirm('Czy na pewno chcesz wygenerować nowy klucz transmisji? Stary klucz przestanie działać.')) {
    return
  }

  try {
    const response = await api.post(`/api/v1/broadcast/channels/${channelId}/regenerate-key`)

    if (response.broadcast_key) {
      generatedKey.value = response.broadcast_key
      alert('Klucz wygenerowany pomyślnie. Skopiuj go teraz!')
    }
  } catch (err: any) {
    alert('Nie udało się wygenerować klucza: ' + err.message)
  }
}

function handleLogout() {
  auth.logout()
  router.push('/login')
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
</script>
