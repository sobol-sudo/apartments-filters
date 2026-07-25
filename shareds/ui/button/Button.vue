<template>
  <button type="button" :disabled="loading" class="button" @click="$emit('click')">
    <slot></slot>

    <span v-if="loading" class="spinner"></span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

// Declared so that a parent's @click is consumed as a component event. Left
// undeclared it also falls through to the root <button> as a native listener,
// and every click runs the parent handler twice.
defineEmits<{ click: [] }>();
</script>

<style lang="scss">
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $color-addition-stroke;
  background-color: transparent;
  cursor: pointer;
  font: $text-p2-medium;
  border-radius: 25px;
  color: $color-main-font;
  transition: $transition-base;
  gap: 10px;
  height: 40px;
  padding: 0 24px;

  &:hover {
    border: 1px solid $color-main-font;
  }

  .spinner {
    border: 2px solid $color-main-font;
    border-top: 2px solid white;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    animation: spin 0.8s linear infinite;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
