<template>
  <div class="wall">
    <div v-if="showWall" class ="quick-wall" :style="{width: boxWidth, height: boxHeight}">
      <div class="monitor" v-for="(info, i) in infos" :key="i">
        <div class="channel" :class="{alarm: info.type === 2 || !info.use, checked: checkedIndex === i + '-' + index}"
        :style="{width: cwd(info.panecount), height: cht(info.panecount)}" v-for="index in info.panecount" :key="info._id+index"
        @click="clickHandler(i + '-' + index, info)">
        </div>
      </div>
    </div>
    <div v-else class="bg-wall">
      请添加电视墙,再进行操作
    </div>
  </div>
</template>
<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import common from './tvcommon'
export default {
  props: {
    camera: {
      type: String
    },
    isPlayback: {
      type: Boolean,
      default: false
    }
  },
  mixins: [common],
  data() {
    return {
      checkedIndex: null,
      oldResource: null,
      infoList: [],
      row: 0,
      clo: 0
    }
  },
  computed: {
    ...mapState({
      monitors: ({ tvwall }) => tvwall.monitorList,
      rtscene: ({ tvwall }) => tvwall.rtscene,
      enableController: ({ tvwall }) => tvwall.enableController
    }),
    ...mapGetters(['layout']),
    infos() {
      if (this.enableController) {
        this.setControllerList()
      } else {
        let count = 0
        if (this.layout) {
          count = this.layout.column * this.layout.row
        }
        this.setList(count)
      }
      return this.infoList
    },
    boxWidth() {
      let oneWidth = 75
      return oneWidth * this.layout.column + 'px'
    },
    boxHeight() {
      let oneHeight = 43
      return oneHeight * this.layout.row + 'px'
    },
    showWall() {
      return this.layout.row > 0
    }
  },
  watch: {
    checkedIndex(index) {
      if (this.isPlayback) {
        return
      }
      if (index !== null) {
        const resource = this.findResource(index)
        this.oldResource = resource
        this.oldIndex = index
        this.addToWall(this.camera, index)
      } else {
        if (this.oldResource) {
          this.addToWall(this.oldResource.resource, this.oldIndex)
          this.oldResource = this.oldIndex = null
        }
      }
    },
    camera() {
      this.oldResource = this.oldIndex = null
    }
  },
  methods: {
    ...mapActions(['openWall']),
    // 设置普通电视墙所需窗口数组
    setList(count) {
      this.infoList = []
      if (count === 0) {
        return this.infoList
      }
      for (let i = 0; i < count; i++) {
        this.infoList.push({
          use: false,
          panecount: 1
        })
      }
      const sc = this.rtscene
      if (sc && sc.info) {
        sc.info.forEach(item => {
          if (item.monitor) {
            const mInfo = this.$lodash.find(this.monitors, it => it._id === item.monitor)
            if (mInfo && mInfo.position < count) {
              this.infoList[mInfo.position] = {
                ...item,
                ...mInfo,
                monitor: mInfo._id,
                use: true
              }
              this.infoList[mInfo.position]._id = item._id
            }
          }
        })
      }
    },
    // 设置拼接控制器所需窗口数组
    setControllerList() {
      this.infoList.length = 0
      if (this.layout.wininfo && this.layout.wininfo.length > 0) {
        this.layout.wininfo.forEach(item => {
          for (let i = 0; i < this.rtscene.info.length; i++) {
            if (this.rtscene.info[i].monitor === item.monitor) {
              const obj = {
                use: true,
                monitor: this.rtscene.info[i].monitor,
                ...this.rtscene.info[i]
              }
              return this.infoList.push(obj)
            }
          }
        })
      }
    },
    cwd(count) {
      const c = Math.sqrt(count)
      const wd = (1 / c) * 100 + '%'
      return `calc(${wd} - 1px)`
    },
    cht(count) {
      const c = Math.sqrt(count)
      const ht = (1 / c) * 100 + '%'
      return `calc(${ht} - 1px)`
    },
    clickHandler(index, info) {
      if (info.type === 2 || !info.use) {
        return
      }
      if (index === this.checkedIndex) {
        this.checkedIndex = null
      } else {
        this.checkedIndex = index
        this.$emit('checkWall', index)
      }
    },
    addToWall(cameraId, index, eventList, ds, streamId, ts) {
      const arr = index.split('-')
      const monitorcode = +arr[0]
      const pane = +arr[1]
      const info = this.infos[monitorcode]
      return this.commonAPIHandle(
        this.openWall({
          monitor: info.monitor,
          number: pane,
          resource: cameraId,
          eventList,
          ds,
          streamId,
          ts
        }),
        '上墙',
        'openWall'
      )
    },
    findResource(index) {
      const arr = index.split('-')
      const monitorcode = +arr[0]
      const pane = +arr[1]
      const info = this.infos[monitorcode]
      return info.resources[pane]
    }
  }
}
</script>
<style scoped lang="less">
.bg-wall {
  width: 150px;
  height: 50px;
  text-align: center;
  line-height: 50px;
}
.wall{
  text-align: left;
}
.quick-wall {
  position: relative;
}
.monitor,
.channel {
  display: inline-block;
  vertical-align: middle;
}

.monitor {
  width: 72px;
  height: 40px;
  margin: 1.5px;
  box-sizing: border-box;
  border: 1px dashed #555555;
  line-height: 0;
}

.channel {
  margin: 0.5px;
  background: #20adff;
  box-sizing: border-box;
}

.channel.alarm {
  background: #1b3153;
}

.channel.checked {
  border: 1px solid #ed3f14;
}
</style>
