# Adding New Infographic - Quick Guide

## 1. Create Component (`app/components/InfographicMyType.vue`)

```vue
<script setup>
import { useInfographic } from '~/composables/useInfographic'

const props = defineProps({
  speed: { type: Number, default: 1.0 },
  // your custom props
})

const emit = defineEmits(['ready'])

const { isVisible, animationStarted, show: baseShow, hide: baseHide, startAnimation } = useInfographic()

const show = async () => {
  // Fetch/prepare data if needed
  await baseShow()
  startAnimation(props.speed, () => emit('ready'))
}

const hide = () => baseHide()

defineExpose({ show, hide })
</script>

<template>
  <Transition name="fade">
    <div v-if="isVisible" class="infographic-root" data-infographic-root="1">
      <div v-if="animationStarted">
        <!-- Your content here -->
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.infographic-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 1920px;
  height: 1080px;
}
/* Use var(--animation-speed) for CSS animations */
</style>
```

## 2. Add to Stage (`app/pages/stage/[channel_id].vue`)

```vue
<!-- Add to template -->
<InfographicMyType
  v-if="currentGraphic === 'my-type' && graphicData"
  ref="graphicRef"
  :speed="graphicData.speed"
  :your-prop="graphicData.your_prop"
  @ready="handleGraphicReady"
/>

<!-- Update showGraphic() -->
if ((graphic === 'team-shotchart' || graphic === 'player-shotchart' || graphic === 'my-type') && graphicRef.value) {
  graphicRef.value.show()
}

<!-- Update handleHide() -->
if ((graphic === 'team-shotchart' || graphic === 'player-shotchart' || graphic === 'my-type') && graphicRef.value) {
  graphicRef.value.hide()
}
```

## 3. Add Controls to Panel (`app/pages/index.vue`)

```vue
<!-- Add button -->
<button
  @click="selectedGraphic = 'my-type'"
  class="px-4 py-2 rounded border"
  :class="selectedGraphic === 'my-type' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
>
  My Graphic
</button>

<!-- Add controls section -->
<div v-if="selectedGraphic === 'my-type'" class="space-y-4">
  <!-- Your input fields -->
</div>

<!-- Update handleShow() -->
else if (selectedGraphic.value === 'my-type') {
  command.your_prop = yourValue.value
}

<!-- Update canShow() -->
else if (selectedGraphic.value === 'my-type') {
  return hasOutput && yourRequiredField.value
}
```

**Done!** Your infographic will work with the same show/hide/ready system as existing graphics.
