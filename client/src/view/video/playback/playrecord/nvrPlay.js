import { mapActions, mapState } from 'vuex'
export default {
  data() {
    return {
    }
  },
  computed: {
    ...mapState({
      isNVR: ({ playback }) => playback.isNVR
    }),
    fakeParam() {
      return false
    }
  },
  methods: {
    ...mapActions(['queryNVRList', 'clearNVRList', 'frontVod', 'nvrRecordOpen']),
    validCheck(obj) {
      if (!this.curNode || !this.curNode.eid) {
        this.warningMsg('请选择一个摄像头')
        return false
      }
      if (this.curNode.eid.type !== 'nvr') {
        this.warningMsg('该设备不支持前端回放')
        return false
      }
      if (!obj.sTime || !obj.eTime || !(obj.eTime > obj.sTime)) {
        this.warningMsg('请选择正常的时间段')
        return false
      }
      return true
    },
    async queryNVR(obj) {
      this.CHANGE_SYNC(this.synchro)
      this.$store.commit('CHANGE_NVR', true)
      if (this.isSync) {
        // 调用同步回放
        return this.queryNVRSync(obj)
      }
      const power = await this.getCameraPower(this.curNode._id)
      if (!power || !power.includes('playbackDownload')) {
        return this.$Notice.warning({ desc: `没有权限！`, title: '警告' })
      }
      if (obj.rowId === -1) {
        this.clearNVRList()
        obj.rowId = 1
      }
      if (!this.validCheck(obj)) {
        return
      }
      obj = {
        ...obj,
        // diskNum: this.selNVR.diskNum, // 硬盘分区,
        channel: this.curNode.chan, // 通道号,
        devIp: this.curNode.eid.ip, // 设备ip,
        devPort: this.curNode.eid.cport, // 设备端口,
        streamType: this.curNode.stream // 码流类型,
      }
      if (this.fakeParam) {
        obj.channel = 1
        obj.devIp = '192.168.14.45'
        obj.devPort = 3721
      }
      this.queryNVRList(obj)
        .then(data => {
          if (!data || !data.total) {
            this.warningMsg('查询无数据')
          }
        })
        .catch(e => {
          console.log(e, '获取nvr列表失败')
          let msg = e.response.data.message || '获取录像列表失败！'
          msg = msg === '请求错误' ? '该通道查询无录像' : msg
          this.errorMsg(msg)
        })
    },
    openPluginNVR(param, time, index) {
      return this.openNVRPlay(time, index)
    },
    async playNVR(obj) {
      this.$store.commit('CHANGE_NVR', true)
      if (this.showThumb !== 1) {
        const canOpen = this.nextAvailablePlugin()
        if (!canOpen) {
          this.$Notice.warning({
            title: '警告',
            desc: '无空闲窗口, 请先关闭部分窗口',
            duration: 5
          })
          return
        }
      }
      const node = obj.node
      const item = {
        recordInfo: [obj.item],
        total: 1,
        res: node._id,
        name: node.name,
        node,
        queryParam: {
          recordType: 'all',
          rowId: 1,
          rowCount: 50,
          sTime: obj.sTime,
          eTime: obj.eTime,
          streamType: obj.streamType,
          channel: obj.channel,
          devIp: obj.devIp,
          devPort: obj.devPort
        },
        queryTime: {
          str: obj.sTime,
          end: obj.eTime
        }
      }
      this.SET_RESOURCE({
        index: this.activedIndex,
        item
      })
      this.plugins[this.activedIndex].initPluginType('record')
      await this.$nextTick()
      try {
        this.setPlayLog({ ip: node.eid.ip, name: node.name })
        const state = await this.openNVRPlay()
        if (state.state === 0) {
          this.avtiveChange(this.activedIndex)
          this.changeTimeline()
        } else {
          this.errorMsg('播放失败, 错误码' + state)
        }
      } catch (e) {
        this.errorMsg(e)
      }
    },
    async openNVRPlay(time, index = this.activedIndex) {
      const info = this.resourceList[index]
      if (!time) {
        time = info.recordInfo[0].sTime
      }
      const param = JSON.parse(JSON.stringify(info))
      param.playInfo = this.findRecordInfo(param.recordInfo, time)
      if (!param.playInfo) {
        return false
      }
      param.playInfo.sTime = time
      const state = await this.plugins[index].NVRopen(param)
      let wallData = this.$refs.playbackVideo.wallData[this.plugin.activedIndex]
      if (wallData) {
        this.nvrVodOpen({ param }, wallData)
      }
      return state
    },
    /**
     * 上墙开流
     * 每次上墙或拖拽都需要重新单独开流
     */
    async nvrVodOpen({ time, param }, wallData) {
      if (!param) {
        const info = this.resourceList[this.activedIndex]
        param = JSON.parse(JSON.stringify(info))
        param.playInfo = this.findRecordInfo(param.recordInfo, time)
      }
      if (!param.playInfo) { return false }
      if (time) {
        param.playInfo.sTime = time
      }
      let res = await this.nvrRecordOpen({
        devIp: param.queryParam.devIp,
        devPort: param.queryParam.devPort,
        channel: param.queryParam.channel,
        sTime: param.playInfo.sTime,
        eTime: param.playInfo.eTime,
        streamType: param.queryParam.streamType,
        streamConnPort: param.node.eid.dport
      })
      if (!res || !res.data) { return }
      res = res.data
      if (wallData) {
        wallData.devCtl.tsIp = res.TsIp
        wallData.devCtl.tsPort = res.TsPort
        wallData.devCtl.streamIdLong = +res.streamId
        this.frontVod(wallData)
      } else {
        return res
      }
    },
    findRecordInfo(list, time) {
      const res = this.$lodash.find(list, item => item.sTime <= time && time <= item.eTime)
      return res
    }
  },
  beforeDestroy() {
    this.clearNVRList()
  }
}
