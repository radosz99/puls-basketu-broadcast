<template>
  <div class="min-h-screen bg-gray-900 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-white text-3xl mb-8">Table Animation Test</h1>

      <div class="mb-4 space-x-4">
        <button
          @click="showTable"
          class="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
        >
          Show Table
        </button>
        <button
          @click="hideTable"
          class="bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700"
        >
          Hide Table
        </button>
      </div>

      <div class="bg-gray-800 p-4 rounded mb-4">
        <div class="text-white text-sm font-mono">
          <div>Visible: {{ isVisible }}</div>
          <div>Animation Started: {{ animationStarted }}</div>
          <div>Table Data: {{ tableData?.length || 0 }} teams</div>
          <div>Slide States: {{ slideInStates.filter(s => s).length }} / {{ slideInStates.length }}</div>
        </div>
      </div>

      <!-- Stage simulation area -->
      <div class="relative bg-black rounded" style="width: 1920px; height: 1080px; transform: scale(0.4); transform-origin: top left;">
        <InfographicTableHorizontal
          ref="tableRef"
          league="plk"
          :speed="1.0"
          @ready="handleReady"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const tableRef = ref(null)
const isVisible = ref(false)
const animationStarted = ref(false)
const tableData = ref(null)
const slideInStates = ref([])

// Watch the component state
watch(() => tableRef.value, (newVal) => {
  if (newVal) {
    // Access internal state if possible
    console.log('[Test] Table ref available:', newVal)
  }
}, { immediate: true })

const showTable = async () => {
  console.log('[Test] Show button clicked')
  if (tableRef.value) {
    await tableRef.value.show()
    console.log('[Test] Show called')

    // Update our debug info
    setTimeout(() => {
      updateDebugInfo()
    }, 100)
  }
}

const hideTable = () => {
  console.log('[Test] Hide button clicked')
  if (tableRef.value) {
    tableRef.value.hide()
    console.log('[Test] Hide called')
  }
}

const handleReady = () => {
  console.log('[Test] Table animation ready!')
}

const updateDebugInfo = () => {
  // Try to peek into component state (for debugging)
  if (tableRef.value) {
    console.log('[Test] Component state:', tableRef.value)
  }
}
</script>
