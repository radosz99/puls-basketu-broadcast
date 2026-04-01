import { ref, nextTick } from 'vue'

/**
 * Base composable for all infographic components
 * Provides common functionality: visibility, show/hide methods, animation control
 */
export const useInfographic = (onShow?: () => Promise<void> | void, onHide?: () => void) => {
  const isVisible = ref(false)
  const animationStarted = ref(false)

  const show = async () => {
    isVisible.value = true
    await nextTick()

    // Mark infographic as ready in DOM
    const root = document.querySelector('[data-infographic-root]')
    if (root) root.setAttribute('data-infographic-ready', '1')

    // Call custom onShow hook if provided
    if (onShow) {
      await onShow()
    }
  }

  const hide = () => {
    isVisible.value = false
    animationStarted.value = false

    // Call custom onHide hook if provided
    if (onHide) {
      onHide()
    }
  }

  const startAnimation = (
    speedMultiplier: number,
    onComplete?: () => void,
    customAnimationLogic?: () => void | Promise<void>
  ) => {
    const root = document.querySelector('[data-infographic-root]')

    // Set CSS animation speed variable
    if (root) {
      root.style.setProperty('--animation-speed', speedMultiplier.toString())
    }

    setTimeout(() => {
      animationStarted.value = true

      // Run custom animation logic if provided
      if (customAnimationLogic) {
        customAnimationLogic()
      }

      // Mark animation as complete after delay
      setTimeout(() => {
        if (root) root.setAttribute('data-animation-complete', '1')
        if (onComplete) onComplete()
      }, 3000 * speedMultiplier)
    }, 300 * speedMultiplier)
  }

  return {
    isVisible,
    animationStarted,
    show,
    hide,
    startAnimation
  }
}
