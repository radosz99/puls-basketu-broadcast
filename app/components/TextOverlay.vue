<template>
  <Transition name="slide">
    <div v-if="isVisible" class="fixed inset-0 flex items-center justify-center pointer-events-none">
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-12 py-8 rounded-lg shadow-2xl max-w-2xl">
        <div class="text-4xl font-bold mb-2">{{ title }}</div>
        <div class="text-2xl">{{ subtitle }}</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle: string
  speed?: number
}

const props = withDefaults(defineProps<Props>(), {
  speed: 1.0
})

const emit = defineEmits<{
  ready: []
}>()

const isVisible = ref(false)

const show = () => {
  isVisible.value = true
  // Emit ready after animation completes
  setTimeout(() => {
    emit('ready')
  }, 500 / props.speed) // 500ms is the CSS transition duration
}

const hide = () => {
  isVisible.value = false
}

defineExpose({
  show,
  hide
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.5s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
