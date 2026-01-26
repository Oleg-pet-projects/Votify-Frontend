import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { i18n } from './language/index';
import { createPinia } from 'pinia';
import './styles/index.scss';
import { useAuthStore } from './store/auth';

createApp(App).use(router).use(i18n).use(createPinia()).mount('#app');
const authStore = useAuthStore();
authStore.init().catch(() => {});
