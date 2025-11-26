import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // 默认语言不显示前缀，其他语言显示前缀
  localeDetection: false // 禁用自动语言检测，始终使用默认语言
});