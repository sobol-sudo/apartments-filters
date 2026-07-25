<script setup lang="ts">
const SCROLL_THRESHOLD = 400;

const isVisible = ref(false);

const checkScrollPosition = () => {
  if (typeof window !== "undefined") {
    isVisible.value = window.scrollY > SCROLL_THRESHOLD;
  }
};

const scrollToTop = () => {
  if (typeof window !== "undefined") {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
};

onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition();
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("scroll", checkScrollPosition);
  }
});
</script>

<template>
  <Transition name="scroll-button">
    <button
      v-if="isVisible"
      class="scroll-to-top"
      @click="scrollToTop"
      aria-label="Scroll to top"
    >
      <svg
        width="10"
        height="15"
        viewBox="0 0 10 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4.99998 14.0032L4.99998 2.00319M4.99998 2.00319L9.00061 6.00319M4.99998 2.00319L0.99935 6.00319"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </Transition>
</template>

<style lang="scss" scoped>
.scroll-to-top {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 40px;
  height: 40px;
  background: $color-multi-brand;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  transition: $transition-base;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  :deep(svg) {
    width: 20px;
    height: 20px;

    path {
      fill: white;
      opacity: 1;
    }
  }
}

.scroll-button-enter-active,
.scroll-button-leave-active {
  transition: all 0.3s ease-in-out;
}

.scroll-button-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.scroll-button-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}
</style>
