<template>
  <div class="attr-video attr-panel">
    <header>
      <span class="title">单兵详情</span>
      <Icon class="btn" type="ios-videocam" @click.native="openVideo"></Icon>
      <span class="status">
        <Icon type="ios-timer-outline"></Icon>
        <span style="color: green;">{{precentage || 0}}%</span>
      </span>
    </header>
    <section class="main">
      <ul class="info-list">
        <li v-show="attrInfo.name">
          <span class="label">姓名</span>
          <span class="value" :title="attrInfo.name">{{attrInfo.name}}</span>
        </li>
        <li v-show="attrInfo.org">
          <span class="label">机构</span>
          <span class="value" :title="attrInfo.org">{{attrInfo.org}}</span>
        </li>
        <li v-show="attrInfo.post">
          <span class="label">职务</span>
          <span class="value" :title="attrInfo.post">{{attrInfo.post}}</span>
        </li>
        <li v-show="attrInfo.jobNum">
          <span class="label">工号</span>
          <span class="value" :title="attrInfo.jobNum">{{attrInfo.jobNum}}</span>
        </li>
        <li v-show="attrInfo.telContacts">
          <span class="label">电话</span>
          <span class="value" :title="attrInfo.telContacts">{{attrInfo.telContacts}}</span>
        </li>
        <li @click="showChat = !showChat">
          <i class="iconfont icon-xiaoxi1 chat-icon" title="开启会话"></i>
        </li>
      </ul>
    </section>
    <div v-if="videoModal">
      <Modal width="900px" v-model="videoModal" title="单兵视频" :mask-closable="false" @on-cancel="videoModal = false">
        <div class="alarm-video">
          <SinglePawn :id="singlePawnId"></SinglePawn>
        </div>
        <div slot="footer"></div>
      </Modal>
    </div>
    <div class="chatRoom" v-if="showChat">
      <h3 class="send-user">{{attrInfo.name}}</h3>
      <bs-scroll ref="scroller" style="height: calc(100% - 42px);">
        <div>
          <p v-for="(msg, index) in msgArry" :key="index" :class="[msg.isSend ? 'send-msg' : '', 'msgDetail']" :title="`时间：${msg.date}`">
            {{msg.value}}
          </p>
        </div>
      </bs-scroll>
    </div>
    <div class="send-msg-box">
      <Input v-model="sendValue" size="large" placeholder="请输入内容" />
      <Button type="primary" @click="sendMsg">发送</Button>
    </div>
  </div>
</template>
<script>
import { getSocket } from 'src/socket/socket.js'
import { read } from 'src/storage/index.js'
import { mapGetters, mapActions } from 'vuex'

export default {
  data() {
    return {
      precentage: 0,
      videoModal: false,
      singlePawnId: '',
      replyUser: '', // 接收用户
      showChat: false,
      sendValue: '', // 发送内容
      senderId: read('userId'),
      msgArry: [
        // {
        //   value: '接收消息', // 消息内容
        //   isSend: false, // 是否为发送的消息
        //   date: ''
        // },
        // {
        //   value: '发送消息',
        //   isSend: true,
        //   date: this.$moment(new Date()).format('YYYY-MM-DD-HH:MM')
        // }
      ],
      singleData: {
        percent: 0,
        name: '',
        org: '',
        post: '',
        jobNum: '',
        telContacts: ''
      },
      isSend: false // 是否发送
    }
  },
  computed: {
    ...mapGetters('map3DApplyIX', ['attrInfo'])
  },
  watch: {
    attrInfo(val) {
      if (val) {
        console.log(val, 'val')
        this.msgArry = []
        this.getPatrolUsers().then(res => {
          for (const key in res) {
            const element = res[key]
            if (element._id === this.attrInfo._id) {
              this.precentage = element.precentage
              console.log(this.precentage, 'precentage')
              continue
            }
          }
        })
        // this.singleData = JSON.parse(JSON.stringify(this.attrInfo))
        // this.singlePawn(val)
      }
    }
  },
  methods: {
    ...mapActions('map3DApplyIX', ['singleSendMssage']),
    ...mapActions(['getRecordInfo', 'getPatrolUsers']),
    singlePawn(data) {
      this.singleData = JSON.parse(JSON.stringify(this.attrInfo))
      this.getRecordInfo({ id: data._id }).then(suc => {
        this.singleData.percent = suc.data.precentage || ''
      }).catch(err => {
        console.log(err)
      })
    },
    openVideo() {
      this.videoModal = true
      this.singlePawnId = this.attrInfo._id
    },
    listScroll() {
      if (this.$refs.scroller) {
        this.$refs.scroller.update()
      }
    },
    // 发送消息
    sendMsg() {
      if (this.isSend) { return }
      if (this.sendValue === '' || this.sendValue.replace(/\s+/g, '') === '') {
        this.sendValue = ''
        return this.$Notice.warning({ title: '警告', desc: '消息不能为空' })
      }
      this.isSend = true
      this.singleSendMssage({
        source: 'pc', // 消息来源
        sender: this.senderId, // 消息发送者
        receiver: this.attrInfo._id, // 消息接收者
        playload: this.sendValue // 消息内容
      }).then(() => {
        this.msgArry.push({
          value: this.sendValue,
          isSend: true,
          date: this.$moment(new Date()).format('YYYY-MM-DD-HH:mm:ss')
        })
        this.sendValue = ''
        this.isSend = false
      }).catch(err => {
        this.isSend = false
        this.$Notice.error({ title: '失败', desc: err.response.data.message })
      })
    },
    // 接收消息回调
    receiveMsg(data) {
      if (this.attrInfo._id === data.sender) {
        this.msgArry.push({
          value: data.playload,
          isSend: false,
          date: data.time
        })
      }
    }
  },
  mounted() {
    const socket = getSocket()
    socket.emit('patrol:instant.message', { usrid: read('userId') })
    socket.on('server:instant.message', msg => {
      console.log('----------', msg)
      this.receiveMsg(msg)
    })
    this.getPatrolUsers().then(res => {
      for (const key in res) {
        const element = res[key]
        if (element._id === this.attrInfo._id) {
          this.precentage = element.precentage
          console.log(this.precentage, 'precentage')
          continue
        }
      }
    })
  }
}
</script>
<style lang="less" scoped>
@import url(./style.less);
.chat-icon {
  cursor: pointer;
  float: right;
  margin-right: 20px;
}
.chatRoom {
  height: 400px;
  padding: 0 10px;
}
.send-user {
  text-align: center;
  padding: 10px 0;
  border-bottom: 1px solid #fff;
}
.msgDetail {
  width: 70%;
  padding: 10px;
  cursor: pointer;
  float: left;
}
.send-msg {
  float: right;
  text-align: right;
  color: #0f0;
  word-break: break-all;
}
.send-msg-box {
  display: flex;
}
</style>
