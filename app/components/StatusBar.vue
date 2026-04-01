<template>
  <div class="bg-gray-800 text-white px-6 py-3 flex items-center justify-between">
    <div class="flex items-center space-x-6">
      <div class="flex items-center space-x-2">
        <div
          class="w-3 h-3 rounded-full"
          :class="wsConnected ? 'bg-green-500' : 'bg-red-500'"
        ></div>
        <span class="text-sm">Panel: {{ wsConnected ? 'Connected' : 'Disconnected' }}</span>
      </div>

      <div class="flex items-center space-x-2">
        <div
          class="w-3 h-3 rounded-full"
          :class="obsOnline ? 'bg-green-500' : 'bg-red-500'"
        ></div>
        <span class="text-sm">Stage Output: {{ obsOnline ? 'Online' : 'Offline' }}</span>
      </div>
    </div>

    <div class="flex items-center space-x-4">
      <div v-if="currentGraphic" class="text-sm">
        On Air: <span class="font-bold">{{ currentGraphic }}</span>
      </div>
      <button
        @click="$emit('logout')"
        class="text-sm hover:text-gray-300"
      >
        Logout
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  wsConnected: boolean
  obsOnline: boolean
  currentGraphic?: string | null
}

defineProps<Props>()
defineEmits<{
  logout: []
}>()
</script>
