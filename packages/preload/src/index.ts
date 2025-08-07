import {sha256sum} from './nodeCrypto.js';
import {versions} from './versions.js';
import {ipcRenderer} from 'electron';


function mainInvoke(channel: string, ...args: any[]) {
  return ipcRenderer.invoke(channel, ...args);
}


export {sha256sum, versions, mainInvoke};
