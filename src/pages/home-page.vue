<template>
  <div class="home-page">
    <h2>Главная страница</h2>

    <div v-if="loading">Загрузка...</div>

    <div v-else-if="user">
      <p><b>Email:</b> {{ user.email }}</p>
      <p><b>Логин:</b> {{ user.login }}</p>
      <p><b>Пароль:</b> {{ user.password }}</p>
    </div>

    <div v-else>
      Ошибка загрузки пользователя
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import api from '../api/index';

interface User {
  email: string;
  login: string;
  password: string;
}

const user = ref<User | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await api.get('/me');
    user.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.home-page {
  max-width: 500px;
  margin: 0 auto;
}
</style>
