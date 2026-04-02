# Adding New Infographic - Quick Guide

## 1. Create Component (`app/components/InfographicMyType.vue`)

```vue
<script setup>
import { useInfographic } from '~/composables/useInfographic'

const props = defineProps({
  speed: { type: Number, default: 1.0 },
  overlayOpacity: { type: Number, default: 0.7 },
  isPreview: { type: Boolean, default: false },
  showBackground: { type: Boolean, default: false },
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
      <!-- Optional dark overlay (if your graphic needs background darkening) -->
      <div
        v-if="!isPreview || showBackground"
        class="dark-overlay"
        :style="{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }"
      ></div>

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
  pointer-events: none;
  z-index: 1000;
}

.dark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 1920px;
  height: 1080px;
  z-index: 0;
  pointer-events: none;
}

/* Use var(--animation-speed) for CSS animations */
/* Use CSS @keyframes for reliable animations that work on stage */
@keyframes slideIn {
  from {
    transform: translateY(-200px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
```

## 2. Add to Stage (`app/pages/stage/[channel_id].vue`)

```vue
<!-- 1. Add ref for your graphic -->
const myTypeRef = ref<any>(null)

<!-- 2. Add to template -->
<InfographicMyType
  v-if="currentGraphic === 'my-type' && graphicData"
  ref="myTypeRef"
  :speed="graphicData.speed"
  :overlay-opacity="graphicData.overlay_opacity || 0.7"
  :is-preview="isPreview"
  :show-background="showBackground"
  :your-prop="graphicData.your_prop"
  @ready="handleGraphicReady"
/>

<!-- 3. Update showGraphic() in nextTick -->
else if (graphic === 'my-type' && myTypeRef.value) {
  myTypeRef.value.show()
}

<!-- 4. Update handleHide() -->
else if (graphic === 'my-type' && myTypeRef.value) {
  myTypeRef.value.hide()
}
```

## 3. Add Controls to Panel (`app/pages/index.vue`)

```vue
<!-- Add button in Graphic Type Selector -->
<button
  @click="selectedGraphic = 'my-type'"
  class="px-4 py-2 rounded border text-sm"
  :class="selectedGraphic === 'my-type' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
>
  My Graphic
</button>

<!-- Add controls section -->
<div v-if="selectedGraphic === 'my-type'" class="space-y-4">
  <!-- Your input fields -->
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">Your Field</label>
    <input v-model="yourField" class="w-full px-3 py-2 border rounded-md" />
  </div>
</div>

<!-- Update buildCommand() -->
else if (selectedGraphic.value === 'my-type') {
  command.your_prop = yourValue.value
}

<!-- Update canShow() -->
else if (selectedGraphic.value === 'my-type') {
  return hasOutput && yourRequiredField.value
}
```

**Done!** Your infographic will work with the same show/hide/ready system as existing graphics.

## Built-in Features Available to All Infographics

### Advanced Controls (Always Available)
- **Speed slider** (0.5x - 3.0x) - Controls animation speed via `var(--animation-speed)`
- **Overlay opacity slider** (0% - 100%) - Controls background darkening (default: 70%)
- **Preview background toggle** - Shows court image behind graphics in preview mode

### Preview System
- **Safe Preview (PODGLĄD)** - Shows graphic ONLY in preview iframe, not live
- **Live Show (POKAŻ NA ŻYWO)** - Shows graphic on all outputs (preview + live stages)
- Preview renders in iframe at `/stage/{channel_id}?preview=true&showbg={true/false}`

### Persistence (Auto-saved to localStorage)
- Selected league
- Selected game (per league)
- Broadcast key (per channel)
- Overlay opacity preference
- Preview background preference

### Game Data
- Games are auto-refreshed every 5 seconds (silent refresh, no flashing)
- In-progress games appear first, then sorted by date descending
- Team buttons and player selectors don't flicker during refresh
