<script setup>
import { nextTick } from 'vue'
import { useInfographic } from '~/composables/useInfographic'

const props = defineProps({
  league: {
    type: String,
    default: 'plk'
  },
  speed: {
    type: Number,
    default: 1.0
  }
})

const emit = defineEmits(['ready'])

const apiBase = useApiBase()
const config = useRuntimeConfig()
const season = config.public.defaultSeason

const tableData = ref(null)
const loading = ref(false)

const { isVisible, animationStarted, show: baseShow, hide: baseHide, startAnimation } = useInfographic()

const fetchTableData = async () => {
  loading.value = true
  try {
    const data = await $fetch(`${apiBase}/api/v1/league-seasons/${props.league}/table?live=true&season=${season}`)
    tableData.value = data.table || []
    console.log('[TableHorizontal] Fetched table data:', tableData.value.length, 'teams')
  } catch (error) {
    console.error('[InfographicTableHorizontal] Failed to fetch table:', error)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const show = async () => {
  console.log('[TableHorizontal] Show called')
  await fetchTableData()
  await baseShow()
  startAnimation(props.speed, () => {
    console.log('[TableHorizontal] Animation complete, emitting ready')
    emit('ready')
  })
}

const hide = () => {
  console.log('[TableHorizontal] Hide called')
  baseHide()
}

defineExpose({ show, hide })
</script>

<template>
  <Transition name="fade">
    <div v-if="isVisible" class="infographic-root" data-infographic-root="1">
      <div v-if="animationStarted && tableData" class="table-container">
        <div class="table-wrapper">
          <div
            v-for="(team, index) in tableData"
            :key="team.team_id"
            class="team-item"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div class="position">{{ team.position }}</div>
            <img
              :src="team.server_logo_url"
              :alt="team.abbr"
              class="team-logo"
            />
            <div class="team-abbr">{{ team.abbr }}</div>
            <div class="team-points">{{ team.points }}</div>
          </div>
        </div>
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

.table-container {
  position: absolute;
  top: 40px;
  left: 80px;
  right: 80px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.team-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(20, 20, 30, 0.9) 100%);
  border-radius: 12px;
  min-width: 75px;
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0;
  animation: slideInFromTop calc(0.6s / var(--animation-speed, 1)) ease-out forwards;
}

@keyframes slideInFromTop {
  0% {
    transform: translateY(-200px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.position {
  font-family: 'Montserrat', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.team-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.4));
}

.team-abbr {
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  letter-spacing: 0.5px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.team-points {
  font-family: 'Montserrat', sans-serif;
  font-size: 20px;
  font-weight: 900;
  color: #00ff88;
  text-align: center;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5), 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity calc(0.5s / var(--animation-speed, 1)) ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
