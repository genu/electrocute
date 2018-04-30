<template lang="pug">
  ph-window
    ph-toolbar(type="header" title="Running processes")
    ph-window-content: table.table-striped: thead: tr
        th Electron Applications
        th Processes
        th Memory
        th CPU
        th
        tr(v-for="(processes, app) in groupedProcesses")
          td {{app}}
          td {{processes.length}}
          td {{getStat(processes, 'memory') | formatSize}}
          td {{getStat(processes, 'cpu') | round(2)}} %
          td(align="center")
            ph-button(@click.native="kill(processes)" size="mini" type="default")
              ph-icon(icon="flash")
              | Kill
    ph-toolbar(type="footer"): div.p5
        strong Memory Usage:
        | &nbsp; {{getStat(processes, 'memory') | formatSize}} of {{totalmem | formatSize}} &nbsp;
        strong CPU Usage:
        | &nbsp; {{getStat(processes, 'cpu') | round(2)}} %
        ph-button-group.pull-right
          ph-button(size="mini" @click.native="openRepo()"): ph-icon(icon="github")
          ph-button(size="mini" @click.native="exit()"): span &nbsp;Exit
</template>

<style lang="scss">
.title {
  -webkit-app-region: drag;
}
.p5 {
  padding: 5px;
}
.pull-right {
  float: right;
}
</style>

<script>
import { ipcRenderer, remote, shell } from "electron";
import { groupBy, sumBy } from "lodash";

export default {
  data() {
    return {
      totalmem: 0,
      processes: []
    };
  },
  mounted() {
    ipcRenderer.send("get-totalmem");
    ipcRenderer.on("totalmem", (e, totalmem) => {
      this.totalmem = totalmem;
    });

    this.getApps();
    setInterval(() => {
      this.getApps();
    }, 3000);
  },
  computed: {
    groupedProcesses() {
      return groupBy(this.processes, "name");
    }
  },
  methods: {
    getStat(processes, metric) {
      return sumBy(processes, `stats.${metric}`);
    },
    getApps() {
      ipcRenderer.send("get-processes");
      ipcRenderer.on("running-electron-processes", (e, processes) => {
        this.processes = processes;
      });
    },
    kill(processes) {
      ipcRenderer.send("kill-processes", processes);
    },
    exit() {
      remote.process.exit(1);
    },
    openRepo() {
      shell.openExternal("https://github.com/genu/electrocute");
    }
  }
};
</script>
