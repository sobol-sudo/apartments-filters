<script setup lang="ts">
interface Props {
    title: string;
    description: string;
}

defineProps<Props>();
</script>

<template>
    <div class="empty-state">
        <div class="empty-state__icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"
                    opacity="0.3" />
                <!-- vertical line -->
                <line x1="32" y1="24" x2="32" y2="40" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    opacity="0.5" />
                <!-- horizontal line -->
                <line x1="24" y1="32" x2="40" y2="32" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    opacity="0.5" />
            </svg>

        </div>

        <h3 class="empty-state__title">{{ title }}</h3>
        <p class="empty-state__description">{{ description }}</p>

        <slot name="action"></slot>
    </div>
</template>

<style lang="scss" scoped>
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 40px;
    text-align: center;

    @media screen and ($media-tablet) {
        padding: 60px 20px;
    }

    &__icon {
        margin-bottom: 24px;
        color: $color-main-font-medium;

        svg {
            width: 64px;
            height: 64px;

            @media screen and ($media-tablet) {
                width: 48px;
                height: 48px;
            }
        }
    }

    &__title {
        font: $text-h1;
        font-size: 24px;
        color: $color-main-font;
        margin-bottom: 12px;

        @media screen and ($media-tablet) {
            font-size: 20px;
        }
    }

    &__description {
        font: $text-p2-regular;
        color: $color-main-font-medium;
        max-width: 400px;
        margin-bottom: 24px;

        @media screen and ($media-tablet) {
            font-size: 14px;
        }
    }
}
</style>
