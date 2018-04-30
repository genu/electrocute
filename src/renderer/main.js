import Vue from "vue";
import axios from "axios";
import iView from "iview";
import { remote } from "electron";
import VuePhotonKit from "vue-photonkit";
import { isUndefined } from "lodash";
import App from "./App";
import "photon/dist/css/photon.css";

Vue.use(VuePhotonKit);

if (!process.env.IS_WEB) Vue.use(require("vue-electron"));

Vue.http = Vue.prototype.$http = axios;
Vue.config.productionTip = false;

Vue.filter("formatSize", (bytes, showLabel) => {
  var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  let result = Math.round(bytes / Math.pow(1024, i), 2);
  if (showLabel || isUndefined(showLabel)) {
    result += " " + sizes[i];
  }
  return result;
});

Vue.filter("round", (value, decimals) => {
  if (!value) {
    value = 0;
  }

  if (!decimals) {
    decimals = 0;
  }

  value = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return value;
});

/* eslint-disable no-new */
new Vue({
  components: { App },
  template: "<App/>"
}).$mount("#app");
