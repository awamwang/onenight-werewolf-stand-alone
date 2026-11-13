<template>
  <a class="skip-link" href="#主内容">跳到主内容</a>
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
  overscroll-behavior: contain;
}
</style>
