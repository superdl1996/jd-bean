/**
 * @Author: DL
 * @Date: 2025-05-19 10:28:32
 * @LastEditors: 2470381299@qq.com
 * @LastEditTime: 2025-05-19 10:54:37
 * @Description:
 */

export {};

declare global {
  interface Window {
    /** 向主进程发送任务 */
    mainInvoke: (key: string, message: string) => Promise<any>;
  }
}
