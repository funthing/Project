<template>
  <!-- 机构树组件 -->
  <div class="organization" :style="{height: scroll ? '100%' : 'auto'}">
    <bs-scroll v-if="scroll" ref="scroller">
      <!-- <VTree ref='tree' style="height:100%;" :treeData="videoOrgData" :options="options" :activeId="activeOrgId" :synchro="synchro" @on-expand="expand" @searchCount="count => $emit('searchCount', count)" @node-click='handleNode' @node-dblclick="dblClick" @openPreviewClick='openPreviewClick' @openAllPreviewClick='openAllPreviewClick' @collectionClick='collectionClick' @creatTreeEnd="creatTreeEnd" @creatTreeStart="creatTreeStart" @loadMore="expand" v-show="searchVal===''"/> -->
      <Bsr-Tree :treeData="videoOrgData[0]||{}" :showCheckbox="synchro" ref="bstree" @node-click='handleNode' @node-dblclick="dblClick" @on-expand="expand" v-show="searchVal===''" v-model="activeNode" :showNode="showNode">
        <template slot-scope="{ node, orgPath }">
          <span :class="{'item': true, 'offline': (!node.nodeId&&(node.eid && node.status !== 1)), 'playing': getPlayingId(node)}" :title="setNodeTitle(node)">
            <i class="iconfont" :class="[getNodeIcon(node).class]" :title="getNodeIcon(node).title"></i>
            {{node.name}}
            <!-- 父级右侧图标 -->
            <span class="right-btn" v-if="($route.fullPath === '/play_video/realtime')&&((node.children && node.children.length > 0) && hasResChild(node))">
              <i class="iconfont icon-preview-all" title="开启所有预览" @click.stop="openAllPreviewClick(node, orgPath)"></i>
            </span>
            <!-- 子级右侧图标 -->
            <span class="right-btn" v-if="($route.fullPath === '/play_video/realtime')&&(!node.children && ('eid' in node))">
              <i class="iconfont icon-preview" title="开启预览" @click.stop="openPreviewClick(node, orgPath)"></i>
              <i class="iconfont icon-collection" title="收藏" @click.stop="collectionClick(node)"></i>
            </span>
          </span>
        </template>
      </Bsr-Tree>

      <SearchResList :oid="orgId" ref="SearchResList" v-show="searchVal!==''" :showCheckbox="synchro" @resClick="handleNode" @resDbclick="dblClick" @on-expand="expand" @openPreviewClick='openPreviewClick' @collectionClick='collectionClick'>
      </SearchResList>
    </bs-scroll>
    <!-- <VTree v-else ref='tree' style="height:100%;" :treeData="videoOrgData" :options="options" :activeId="activeOrgId" :searchVal="searchVal" :synchro="synchro" @on-expand="$emit('on-expand')" @searchCount="count => $emit('searchCount', count)" @node-click='handleNode' @node-dblclick="dblClick" @openPreviewClick='openPreviewClick' @openAllPreviewClick='openAllPreviewClick' @collectionClick='collectionClick' @creatTreeEnd="creatTreeEnd" @creatTreeStart="creatTreeStart" @loadMore="expand" /> -->
    <bsr-tree v-else :treeData="videoOrgData[0]||{}" :showCheckbox="synchro" ref="bstree" @node-click='handleNode' @node-dblclick="dblClick" @on-expand="$emit('on-expand')" >
      <template slot-scope="{ node }">
        <span :class="{'item': true, 'offline': (!node.nodeId&&(node.eid && node.status !== 1)), 'playing': getPlayingId(node)}" :title="setNodeTitle(node)">
          <i class="iconfont" :class="[getNodeIcon(node).class]" :title="getNodeIcon(node).title"></i>
          {{node.name}}
        </span>
      </template>
    </bsr-tree>

    <div class="selectFav" v-if="openselectFav" @click.stop>
      <iframe v-if="openselectFav"></iframe>
      <div class="selectFavBox">
        <div class="header">
          <div class="title">选择收藏夹</div>
          <div class="flag" @click='cancel'>
            <Icon type="close"></Icon>
          </div>
        </div>

        <ul class="content">
          <li class="item">
            <table>收藏夹</table>
            <bsr-select :options="favoritesList" v-model="favoritesName" style="width:165px;float:left;"></bsr-select>
          </li>

          <li class="item" v-if="favoritesName === 'add'">
            <table>新建收藏夹</table>
            <Input v-model="nowName" placeholder="请输入..." style="width: 165px;float:left;" class='editInput' />
          </li>
        </ul>
        <Button type="primary" @click='save' class="save">保存</Button>
      </div>
    </div>
  </div>
</template>
<script>
import SearchResList from './SearchResList'
import { getNodeIcon } from 'components/BStree/commonMethods.js'
import { mapState, mapActions, mapMutations } from 'vuex'
export default {
  name: 'Organization',
  components: { SearchResList },
  props: {
    scroll: {
      default: true
    },
    searchVal: {
      default: ''
    },
    synchro: {
      default: false
    },
    options: {
      default() {
        return {
          showSearch: false,
          // showFolder: false,
          showOpenPreview: true,
          showOpenAllPreview: true,
          showCollection: true,
          isMapDate: false,
          search: {
            onlyLeaf: true
          }
        }
      }
    }
  },
  data() {
    return {
      nowName: '',
      currentId: '',
      openselectFav: false,
      favoritesList: [],
      favoritesName: '',
      treeData: [],
      activeNode: {}
    }
  },
  computed: {
    ...mapState({
      videoOrgData: ({ videoOrg }) => videoOrg.videoOrgData,
      favData: ({ videoOrg }) => videoOrg.favData,
      curNode: ({ videoOrg }) => videoOrg.curNode,
      activeOrgId: ({ videoOrg }) => videoOrg.activeOrgId,
      playingIds: ({ videoOrg }) => videoOrg.playingIds,
      pollId: ({ videoOrg }) => videoOrg.pollId,
      isAdmin: ({ videoOrg }) => videoOrg.isAdmin
    }),
    // 获取父级的视频组件对象
    plugin() {
      return this.$parent.$parent.$refs.frame
    },
    orgId() {
      return this.videoOrgData[0] ? this.videoOrgData[0]._id : ''
    }
  },
  watch: {
    searchVal(value) {
      this.$refs.SearchResList.isSearching = true
      this.$refs.SearchResList.searchRes(value)
    }
  },
  methods: {
    ...mapActions([
      'getvideoOrg',
      'getFavorites',
      'addFavorites',
      'setFavorites',
      'getVideoOrgData',
      'updateDevStatus',
      'getResSearch',
      'emptyOrgdata',
      'upPlayindId'
    ]),
    ...mapMutations(['SET_CURNODE', 'SET_ORGID', 'SET_POLL']),
    /**
     * 非管理员用户，没有镜头的节点隐藏
     */
    showNode(node) {
      if (this.isAdmin) {
        return true
      }
      this.hasChild(node)
      return this.isShow
    },
    hasChild(node) {
      this.isShow = false
      if ('eid' in node) {
        this.isShow = true
        return
      }
      if (node.children && node.children.length > 0) {
        for (let index = 0; index < node.children.length; index++) {
          this.hasChild(node.children[index])
          if (this.isShow) {
            break
          }
        }
      }
    },
    /**
     * 获取节点图标
     */
    getNodeIcon(item) {
      return getNodeIcon(item)
    },
    setNodeTitle(node) {
      return node.eid ? (node.eid.ip ? `${node.name}\nIP:${node.eid.ip}` : node.name) : node.name
    },
    /**
     * 子节点是否含有资源
     */
    hasResChild(item) {
      if (item.children && item.children.length > 0) {
        for (let i = 0; i < item.children.length; i++) {
          if ('eid' in item.children[i]) {
            return true
          }
        }
        return false
      }
      return false
    },
    /**
     * 当前节点是否正在播放
     */
    getPlayingId(item) {
      if (item.eid) {
        let id = item._id + ''
        return id && this.playingIds.includes(id.split('_')[0])
      }
      return false
    },
    expand(node) {
      this.scroll && this.$refs.scroller.update()
      this.$emit('loadMore')
    },
    handleNode(node, o) {
      this.activeNode = node
      this.SET_ORGID(node._id)
      this.SET_CURNODE(node)
      this.$emit('changeNodeId', node._id)
    },
    // 播放预览 ---现场
    async openPreviewClick(node, orgPath) {
      // 是否正在轮训 如果是就关闭轮训
      if (this.pollId) {
        const arr = this.plugin.clearTimedPlay()
        this.upPlayindId(arr)
        this.plugin.activedIndex = 0
        this.SET_POLL('')
      }
      // 找寻闲置窗口 如果当前没有闲置的窗口就把焦点窗口给关了
      let index = 1
      for (const i in this.plugin.pluginData) {
        index = parseInt(i) + 2
      }
      if (index > this.plugin.showscreen) {
        await this.plugin.stop()
      } else {
        this.plugin.nextEmptyPlugin()
      }
      this.SET_CURNODE(node)
      let param = {
        id: node._id,
        pid: node.eid._id,
        orgPath: orgPath,
        name: node.name,
        type: 'video',
        streamType: node.stream || 'main',
        ip: node.eid.ip,
        port: node.eid.cport,
        dport: node.eid.dport,
        channel: node.chan,
        vendor: node.eid.manufacturer,
        monitorType: node.monitortype
      }
      if (node.nodeId) {
        param = {
          ...param,
          gbDevId: node.nodeId,
          shareServer: node.shareServer
        }
      }
      // 调用播放方法
      this.plugin.open(param)
      this.$emit('preview')
      // }
    },
    // 双击节点的时候也是调的openPreviewClick这个方法
    dblClick(node) {
      // 只有在预览页面采用
      this.handleNode(node)
      if (this.$route.fullPath === '/play_video/realtime') {
        this.openPreviewClick(node)
      }
    },
    // 一次展开所有节点
    openAllPreviewClick(node, orgPath) {
      if (this.pollId) {
        const arr = this.plugin.clearTimedPlay()
        this.upPlayindId(arr)
        this.plugin.activedIndex = 0
        this.SET_POLL('')
      }
      // 遍历当前节点下的所有子节点 获取播放所需要的信息
      const _self = this

      function loop(list, fn) {
        list.forEach(item => {
          const ret = fn.call(_self, item)
          if (ret.isDone === false) {
            loop(ret.children, fn)
          }
        })
      }

      const paramlist = []

      loop(node.children, item => {
        if ('eid' in item) {
          let p = {
            id: item._id,
            pid: item.eid._id,
            type: 'video',
            orgPath: item.orgPath || (orgPath ? orgPath + '/' + item.name : ''),
            name: item.name,
            streamType: item.stream || 'main',
            ip: item.eid.ip,
            port: item.eid.cport,
            dport: item.eid.dport,
            channel: item.chan,
            vendor: item.eid.manufacturer,
            monitorType: item.monitortype
          }
          if (item.nodeId) {
            p = {
              ...p,
              gbDevId: item.nodeId,
              shareServer: item.shareServer
            }
          }
          paramlist.push(p)
        }
        return {
          isDone: !item.children,
          children: item.children ? item.children : null
        }
      })
      if (paramlist.length > this.plugin.showscreen) {
        paramlist.splice(this.plugin.showscreen)
        this.$Notice.warning({ desc: '无空闲窗口显示更多通道！', title: '警告' })
      }
      // 开启视频多个窗口
      this.plugin.openAll(paramlist)
    },
    collectionClick(node) {
      this.currentId = node._id
      this.openselectFav = true
      this.favoritesName = '0'
      for (const i in this.favData) {
        this.favoritesList.push({
          label: this.favData[i].name,
          value: i
        })
      }
      this.favoritesList.push({
        label: '新建收藏夹',
        value: 'add'
      })
    },
    cancel() {
      this.favoritesName = ''
      this.favoritesList = []
      this.openselectFav = false
      this.nowName = ''
    },
    save() {
      // 未添加收藏的设备
      if (this.favoritesName === 'add') {
        if (this.nowName) {
          if (this.nowName.length > 26) {
            this.warningMsg('收藏夹名字不能超过26个字符')
            return
          } else if (this.nowName.replace(/\s+/g, '') === '') {
            this.warningMsg('收藏夹名字不能为空')
            return
          }
          let temp = { name: this.nowName, _id: this.currentId.split('_')[0] }
          this.addFavorites(temp)
            .then(res => {
              this.successMsg('收藏成功！')
            })
            .catch(error => {
              if (error.response) {
                this.errorMsg(error.response.data.message)
              } else {
                this.errorMsg('收藏失败！')
              }
              console.log('logout error: ' + error)
            })
        }
      } else {
        let obj = this.$lodash.cloneDeep(this.favData[this.favoritesName])
        obj.resources = []
        for (const i in obj.children) {
          if (this.currentId.split('_')[0] === obj.children[i]._id.split('_')[0]) {
            this.cancel()
            this.$Notice.warning({ desc: '收藏夹中已存在该设备！', title: '警告' })
            return
          }
          obj.resources.push(obj.children[i]._id.split('_')[0])
        }
        obj.resources.push(this.currentId.split('_')[0])
        delete obj.children
        this.setFavorites(obj)
          .then(res => {
            this.successMsg('收藏成功！')
          })
          .catch(error => {
            if (error.response) {
              this.errorMsg(error.response.data.message)
            } else {
              this.errorMsg('收藏失败！')
            }
            console.log(error)
          })
      }
      this.cancel()
    },
    getSelectedNodes() {
      return this.searchVal !== '' && this.synchro
        ? this.$refs.SearchResList.getSelectedNodes()
        : this.$refs.bstree.getSelectedNodes()
    },
    getDeviceOnlineState() {
      // this.getVideoOrgData().then(suc => {
      //   this.$refs.tree.$refs.tree.syncOfflineState(suc.data)
      // })
      if (this.searchVal) {
        return
      }
      this.getvideoOrg(1).then(suc => {
        this.$refs.tree.$refs.tree.syncOfflineState(suc.data)
      })
    },
    creatTreeStart(n) {},
    creatTreeEnd() {}
  },
  created() {
    this.videoOrgData.length && this.SET_ORGID(this.videoOrgData[0]._id)
    // this.getFavorites()
    this.getvideoOrg()
    this.updateDevStatus()
    // this.timer = setInterval(() => {
    //   this.getDeviceOnlineState()
    // }, 30 * 1000)
  },
  mounted() {},
  updated() {
    this.$emit('on-expand')
  },
  beforeDestroy() {
    clearInterval(this.timer)
    this.timer = null
  }
}
</script>
<style scoped>
.organization {
  /*width: 100%;*/
  height: 100%;
}
.selectFav {
  color: #fff;
  width: 310px;
  height: 210px;
  position: absolute;
  background: #1b3153;
  top: 50vh;
  left: 50vw;
  margin-left: -155px;
  margin-top: -240px;
  z-index: 9999999;
  border-radius: 8px;
}
iframe,
.selectFavBox {
  background-color: transparent;
  position: absolute;
  z-index: 0;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border: 0 none;
}
.header {
  width: 100%;
  height: 40px;
  line-height: 40px;
  border-bottom: 1px solid #0f2343;
  padding: 0 24px;
  margin-bottom: 10px;
  background: #0f2343;
  border-radius: 8px 8px 0 0;
}
.header .title {
  float: left;
}
.header .flag {
  float: right;
  cursor: pointer;
}
.selectFavBox ul.content {
  padding: 0;
}
.content {
  list-style: none;
}
.content li.item {
  padding: 10px 24px;
  width: 100%;
  height: 50px;
}
.content li.item table {
  width: 75px;
  line-height: 32px;
  float: left;
}
.save {
  position: absolute;
  right: 20px;
  bottom: 12px;
}
</style>
