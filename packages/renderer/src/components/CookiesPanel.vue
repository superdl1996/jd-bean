<script lang="ts" setup>
import {reactive, ref, watchEffect} from 'vue';
import {Form, message} from 'ant-design-vue';
import type Electron from 'electron';

const partitionPre = 'persist:jd-';

type CookieItem = {
  username: string;
  key: string;
};


const invokeKey = btoa('mainInvoke') as keyof Window;
const baseUrl = 'http://192.3.24.37:5700/open';
const client_id = '475-EECHnAE-';
const client_secret = '4IL9PwlkP6VBlnosF_qao3vJ';
let token: string | undefined = undefined;
let tokenType: string | undefined = undefined;


const filterForm = reactive({
  filterKey: 'pt_key,pt_pin',
});

const userCookies = ref<CookieItem[]>([
    // {username: '董磊', key: 'dl'},
    // {username: '王亚欣', key: 'wyx'},
    // {username: '董磊190', key: 'dl190'},
  ],
);


const clipboardWrite = async (value: string) => {
  window?.[invokeKey]?.('clipboard:writeText', value);
  message.success('复制成功');
};

const getAsyncCookie = async (userCookiesKey?: string) => {
  const cookieSources = userCookiesKey ? [{key: userCookiesKey}] : userCookies.value;
  const cookiePromises = cookieSources.map(({key}) => window?.[invokeKey]?.('session:getCookies', partitionPre + key).then((v: Electron.Cookie[]) => [key, v]));
  const cookies = await Promise.all(cookiePromises);
  return Object.fromEntries(cookies);
};

const getAllCookie = async () => {
  const allCookies = await getAsyncCookie();
  clipboardWrite(JSON.stringify(allCookies));
  return allCookies;
};

const copyCookies = async (key: string) => {
  const cookies = await getCookies(key);
  clipboardWrite(cookies);
};

const getCookies = async (key: string) => {
  const allCookies = await getAsyncCookie(key);
  const domainCookies = allCookies[key];
  if (!domainCookies) return message.error('暂无cookie');
  const selectCookiesName = filterForm.filterKey.split(',');
  const cookiesParts = selectCookiesName.map(key => {
    const needCookie = domainCookies.find((cookie: Electron.Cookie) => cookie.name === key);
    return `${needCookie?.name}=${needCookie?.value};`;
  });
  return cookiesParts.join('');
};

const open = ref(false);

interface FormState {
  username: string;
  key: string;
}

const formState = reactive<FormState>({
  username: '',
  key: '',
});

const {resetFields, validate, validateInfos} = Form.useForm(formState, reactive({
  username: [{required: true, message: '请填写姓名'}],
  key: [{required: true, message: '请填写key'}],
}));


const openAddModal = async () => {
  resetFields();
  open.value = true;
};

const handleAddCookie = async () => {
  const {username, key} = await validate();
  if (userCookies.value.some(item => item?.key === key)) {
    message.error(`key值 ${key} 已存在, 请修改!`);
    return;
  }
  userCookies.value.push({username, key});
  open.value = false;
};

// 启用 cookies
const enableQlCookies = async (key: string) => {
  const enableColkiesRes = await window?.[invokeKey]?.('net:fetch', `${baseUrl}/envs/enable?t=${Date.now()}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${tokenType} ${token}`,
    },
    body: [key],
  });
  console.log(enableColkiesRes);
  if (enableColkiesRes?.code === 200) {
    message.success('启用成功');
  } else {
    message.error('启用失败');
  }
};

// 设置 cookies
const setQlCookie = async (key: string) => {
  const cookies = await getCookies(key);
  const putCookiesRes = await window?.[invokeKey]?.('net:fetch', `${baseUrl}/envs`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${tokenType} ${token}`,
    },
    body: {id: key, name: 'JD_COOKIE', value: cookies},
  });

  if (putCookiesRes?.code === 200) {
    message.success('设置 Cookies 成功');
    await enableQlCookies(key);
    await getCkTest();
  } else {
    message.error('设置 Cookies 失败');
  }
};

const getTokens = async () => {
  const res = await window?.[invokeKey]?.('net:fetch', `${baseUrl}/auth/token?client_id=${client_id}&client_secret=${client_secret}`);
  const {token_type, token: _token} = res?.data;
  token = _token;
  tokenType = token_type;
  return res;
};

const getCkTest = async () => {
  const res = await window?.[invokeKey]?.('net:fetch', `${baseUrl}/crons?searchValue=ck检测`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${tokenType} ${token}`,
    },
  });
  const ckData = res?.data?.data?.[0];
  const res1 = await window?.[invokeKey]?.('net:fetch', `${baseUrl}/crons/run?t=${Date.now()}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${tokenType} ${token}`,
    },
    body: [ckData?.id],
  });

  if (res1?.code === 200) {
    message.success('发送 CK检测 成功');
  } else {
    message.error('发送 CK检测 失败');
  }

};

const getList = async () => {
  await getTokens();
  const res = await window?.[invokeKey]?.('net:fetch', `${baseUrl}/envs`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${tokenType} ${token}`,
    },
  });
  const data = res?.data;
  userCookies.value = data?.map((item: {remarks?: string; id?: string}) => ({username: item?.remarks, key: item?.id}));
};

watchEffect(getList);


</script>

<template>
  <div class="w-full p-4 box-border">
    <div class="mb-2">
      <a-input v-model:value="filterForm.filterKey" placeholder="请输入需要的cookie值,逗号隔开,如: pt_key,pt_pin" />
    </div>
    <div class="mb-2">
      <a-space>
        <a-button type="primary" @click="openAddModal">新增</a-button>
        <a-button type="primary" @click="getAllCookie">获取全部cookies</a-button>
        <a-button type="primary" @click="getCkTest">CK检测</a-button>
      </a-space>

    </div>

    <a-row :gutter="[16,16]">
      <a-col v-for="item in userCookies" :key="item.key" :lg="8" :md="12" :sm="12" :xl="6" :xs="24">
        <a-card :body-style="{ padding:'0',overflow:'hidden' }">
          <template #title>
            <a-flex align="center" justify="space-between">
              <div class="flex-auto">
                <span>{{ item?.username }}</span>
              </div>
              <a-space>
                <a-button type="primary" @click="copyCookies(item?.key)">获取cookies</a-button>
                <a-button type="primary" @click="setQlCookie(item?.key)">设置cookies到ql</a-button>
              </a-space>
            </a-flex>

          </template>
          <webview :partition="partitionPre + item?.key" :sign="item?.key" class="h-80 m-t-1"
                   src="https://plogin.m.jd.com/login/login?appid=300&returnurl=https://my.m.jd.com/"></webview>
        </a-card>
      </a-col>

    </a-row>

    <a-modal v-model:open="open" title="新增" @ok="handleAddCookie">
      <a-form
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        autocomplete="off"
        name="add_form"
      >
        <a-form-item
          label="姓名"
          name="username"
          v-bind="validateInfos.username"
        >
          <a-input v-model:value="formState.username" />
        </a-form-item>

        <a-form-item
          label="Key"
          name="key"
          v-bind="validateInfos.key"
        >
          <a-input v-model:value="formState.key" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>

</template>

<style scoped>

</style>
