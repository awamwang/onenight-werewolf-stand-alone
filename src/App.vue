<template>
  <router-view class="app-shell" />
</template>

<script setup lang="ts"></script>

<style>
.app-shell {
  height: 100%;
  max-height: 100dvh;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
