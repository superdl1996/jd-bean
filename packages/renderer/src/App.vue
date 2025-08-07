<script lang="ts" setup>
/** 组件中文 */
import zhCN from 'ant-design-vue/es/locale/zh_CN';

/** 时间组件中文  - 组件库规定需要指定 */
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

import CookiesPanel from './components/CookiesPanel.vue';
</script>

<template>
  <a-config-provider :locale="zhCN">
    <CookiesPanel />
  </a-config-provider>
</template>
