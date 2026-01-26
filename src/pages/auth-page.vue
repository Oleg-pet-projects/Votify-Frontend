<template>
  <div class="auth-page">
    <h2 class="title">
      {{ isLogin ? 'Авторизация' : 'Регистрация' }}
    </h2>

    <form class="form" @submit.prevent="onSubmit">
      <!-- Email (только регистрация) -->
      <div v-if="!isLogin" class="field">
        <label>Email</label>
        <input
          type="email"
          v-model="authStore.form.email"
          required
        />
      </div>

      <!-- Login -->
      <div class="field">
        <label>Логин</label>
        <input
          type="text"
          v-model="authStore.form.login"
          required
        />
      </div>

      <!-- Password -->
      <div class="field">
        <label>Пароль</label>
        <input
          type="password"
          v-model="authStore.form.password"
          required
        />
      </div>

      <button type="submit">
        {{ isLogin ? 'Войти' : 'Зарегистрироваться' }}
      </button>
    </form>

    <button class="switch" @click="toggleMode">
      {{ isLogin ? 'Создать аккаунт' : 'Уже есть аккаунт' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

type AuthMode = 'login' | 'register';

const authStore = useAuthStore();
const router = useRouter();

const mode = ref<AuthMode>('login');
const isLogin = computed(() => mode.value === 'login');

function toggleMode(): void {
  mode.value = isLogin.value ? 'register' : 'login';
}

watch(isLogin, (value) => {
  if (value) {
    authStore.form.email = '';
  }
});

async function onSubmit(): Promise<void> {
  try {
    if (isLogin.value) {
      await authStore.login();
    } else {
      await authStore.register();
    }

    // ✅ если токен получен — идём на главную
    if (authStore.isAuth()) {
      router.push({ name: 'home' });
    }
  } catch (e) {
    console.error(e);
  }
}
</script>

<style scoped>
.auth-page {
  max-width: 400px;
  margin: 0 auto;
}

.title {
  margin-bottom: 16px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
}

.switch {
  margin-top: 12px;
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
}
</style>
