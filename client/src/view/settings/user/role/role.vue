<template>
  <div class="main role">
    <div class="role-main">
      <div class="main-left">
        <div class="role-top">
          <Button-group>
            <Button icon="plus" title="添加" @click="operateRole(0)"></Button>
            <Button icon="trash-a" title="删除" :disabled="disabledFun" @click="deleteRole"></Button>
            <Button icon="ios-copy" title="复制" @click="operateRole(1)"></Button>
            <Button icon="arrow-up-c" title="上移" :disabled="upPower" @click="moveNode(0)"></Button>
            <Button icon="arrow-down-c" title="下移" :disabled="downPower" @click="moveNode(1)"></Button>
          </Button-group>
        </div>
        <div class="role-bottom">
          <ul class="ul-style">
            <li class="li-style" v-for="(item, index) in roleList" :class="{ 'liActive': index === activeRole }" :key="item._id" @click="selectRole(index)" :title="item.name">{{ item.name }}</li>
          </ul>
        </div>
      </div>
      <div class="main-right">
        <div class="module-control">
          <div class="save-control">
            <Form ref="roleValidate" :rules="roleValidate" :model="roleData" label-position="left" :label-width="86" class="role-style">
              <FormItem label="角色名称" prop="name">
                <Input :readonly="disabledFun" v-model="roleData.name" style="width: 240px;"></Input>
              </FormItem>
            </Form>
            <Button :disabled="saveDisabled" type="ghost" @click="saveRoleInfo('roleValidate')" style="margin-left: 32px;">保存</Button>
          </div>
          <div class="control-style">
            <div class="fun-control">
              <div class="funCheck-style">
                <span class="checkbox" :class="{'disChecked': disabledFun}">
                  <span class="ivu-checkbox" :class="{'ivu-checkbox-checked':funIsChecked}" @click.stop="allCheck('funTree')">
                    <span class="ivu-checkbox-inner"> </span>
                  </span>
                </span>
                <span>功能业务模块</span>
              </div>
              <div class="fun-tree">
                <bs-scroll ref="funTreeScroll" style="width: 100%; height: 100%;" class="scroll-style">
                  <bsr-tree :treeData="funTree" :selective="() => !disabledFun" :showCheckbox="showCheck" :selectNode="roleData.funcActions" ref="funTree" @on-expand="funTreeExpand" @handlechecked="funCheckNode">
                    <template slot-scope="{ node }">
                      <span>{{node.name}}</span>
                    </template>
                  </bsr-tree>
                </bs-scroll>
              </div>
            </div>
            <div class="system-control">
              <div class="sysCheck-style">
                <span class="checkbox" :class="{'disChecked': disabledFun}">
                  <span class="ivu-checkbox" :class="{'ivu-checkbox-checked':sysIsChecked}" @click.stop="allCheck('systemTree')">
                    <span class="ivu-checkbox-inner"> </span>
                  </span>
                </span>
                <span>系统配置模块</span>
              </div>
              <div class="system-tree">
                <bs-scroll ref="systemTreeScroll" class="scroll-style">
                  <bsr-tree :treeData="sysTree" :selective="() => !disabledFun" :showCheckbox="showCheck" :selectNode="roleData.sysActions" ref="systemTree" @on-expand="systemTreeExpand" @handlechecked="sysCheckNode">
                    <template slot-scope="{ node }">
                      <span>{{node.name}}</span>
                    </template>
                  </bsr-tree>
                </bs-scroll>
              </div>
            </div>
          </div>
        </div>
        <div class="resource-control">
          <div class="type-sel">
            <RadioGroup v-model="resourceType" @on-change="resourceChange">
              <Radio label="0">视频通道</Radio>
              <Radio label="1">报警设备</Radio>
              <Radio label="2">消防设备</Radio>
              <Radio label="3">报警求助设备</Radio>
            </RadioGroup>
          </div>
          <div class="resource-panel">
            <div class="resource-main">
              <div class="resource-title">
                <div class="title-style">资源权限</div>
                <Input v-model="searchName" icon="ios-search-strong" placeholder="按名称模糊查询" class="search-style"></Input>
              </div>
              <div class="resource-tree">
                <bs-scroll ref="resourceTreeScroll" class="scroll-style">
                  <bsr-tree v-show="searchName===''" v-model="resChecked" :treeData="resource" :selectNode="roleData.resources" ref="resourceTree" @on-expand="resourceTreeExpand" @node-click="resourceNode">
                    <template slot-scope="{ node }">
                      <span class="resTree-style" :title="node.name" :style="{color: getNodeColor(node)}">
                        <i class="iconfont" :class="[getNodeIcon(node).class]" :title="getNodeIcon(node).title"></i>
                        {{node.name}}
                      </span>
                    </template>
                  </bsr-tree>
                  <SearchList v-show="searchName!==''" :searchVal="searchName" :oid="resource._id" @resClick="channelClick" ref="searchResRef"></SearchList>
                </bs-scroll>
              </div>
            </div>
            <div class="property-control">
              <div class="title-style">资源权限属性</div>
              <div class="property-content">
                <div class="property-style">
                  <CheckboxGroup v-model="propertyArr" @on-change="checkAllGroupChange">
                    <Checkbox class="check-style" v-for="item in checkList" :key="item.labelValue" :disabled="item.isDisabled" :label="item.labelValue">{{ item.labelName }}</Checkbox>
                  </CheckboxGroup>
                </div>
                <Button class="copy-btn" :disabled="copySet" @click="copyPowerShow = true" type="ghost">复制到</Button>
              </div>
              <div class="title-style">登陆方式</div>
              <div class="property-content" style="padding-left: 14px;">
                <RadioGroup v-model="roleData.loginType" vertical>
                  <Radio class="radio-style" label="1">账户</Radio>
                  <Radio class="radio-style" label="2">Ukey</Radio>
                  <Radio class="radio-style" label="3">账户/Ukey</Radio>
                  <Radio class="radio-style" label="4">账户+Ukey</Radio>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Modal :mask-closable="false" v-model="roleShow" width="450" :title="modalTitle" @on-cancel="operateCancel('userValidate')">
      <Form ref="userValidate" :rules="userValidate" :model="roleForm" label-position="left" :label-width="90">
        <FormItem label="角色名称" prop="roleName">
          <Input v-model="roleForm.roleName"></Input>
        </FormItem>
      </Form>
      <div slot="footer">
        <Button @click="operateCancel('userValidate')" type="ghost">取消</Button>
        <Button @click="operateAffirm('userValidate')" type="primary">确认</Button>
      </div>
    </Modal>
    <Modal :mask-closable="false" v-model="copyPowerShow" width="450" title="复制到其他资源" @on-cancel="copyPowerCancel">
      <div class="modal-tree">
        <bs-scroll ref="othersTreeScroll" class="scroll-style">
          <bsr-tree :treeData="resource" @on-expand="othersTreeExpand" :selectNode="[]" ref="othersTree" :showCheckbox="showCheck">
            <template slot-scope="{ node }">
              <span class="modTree-style" :title="node.name">
                <i class="iconfont" :class="[getNodeIcon(node).class]" :title="getNodeIcon(node).title"></i>
                {{node.name}}
              </span>
            </template>
          </bsr-tree>
        </bs-scroll>
      </div>
      <div slot="footer">
        <Button @click="copyPowerCancel" type="ghost">取消</Button>
        <Button @click="copyPowerAffirm" type="primary">确认</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import FormValidate from '../formValidate.js'
import SearchList from './searchList'
import { mapState, mapActions } from 'vuex'
import { read } from '../../../../storage/index.js'
import {getNodeIcon} from 'components/BStree/commonMethods.js'
import './role.css'
export default {
  name: 'role',
  components: { SearchList },
  mixins: [FormValidate],
  data() {
    return {
      searchName: '',
      modalTitle: '',
      resourceType: '0',
      activeRole: '',
      resourceId: '',
      searchOid: '',
      roleShow: false,
      copyPowerShow: false,
      showCheck: true,
      disabledFun: true,
      saveDisabled: true,
      copySet: true,
      propertySet: true,
      firePropertySet: true,
      helpPropertySet: true,
      alarmPropertySet: {
        receiveSet: true,
        confireSet: true,
        alarmCleanSet: true,
        deploymentSet: true,
        disarmingSet: true,
        cleanSet: true,
        bypassSet: true,
        removeBypassSet: true
      },
      upPower: true,
      downPower: true,
      funCount: 0,
      sysCount: 0,
      roleForm: {
        roleName: ''
      },
      funTree: {},
      sysTree: {},
      resource: {},
      resChecked: {},
      roleList: [],
      propertyArr: [],
      resCheckNode: [],
      roleData: {
        _id: '',
        name: '',
        loginType: '',
        funcActions: [],
        sysActions: [],
        resources: []
      },
      resourceData: {
        videoTree: {},
        alarmTree: {},
        fireTree: {},
        helpTree: {}
      }
    }
  },
  computed: {
    ...mapState({
      roleArr: ({roleManage}) => roleManage.roleArr,
      roleInfo: ({roleManage}) => roleManage.roleInfo,
      funTreeData: ({roleManage}) => roleManage.funTreeData,
      sysTreeData: ({roleManage}) => roleManage.sysTreeData,
      channelData: ({roleManage}) => roleManage.channelData,
      alarmDeviceData: ({roleManage}) => roleManage.alarmDeviceData,
      fireDeviceData: ({roleManage}) => roleManage.fireDeviceData,
      helpDeviceData: ({roleManage}) => roleManage.helpDeviceData
    }),
    sysIsChecked: {
      get() {
        return this.roleData.sysActions.includes(this.sysTree._id)
      }
    },
    funIsChecked: {
      get() {
        return this.roleData.funcActions.includes(this.funTree._id)
      }
    },
    checkList: {
      get() {
        return this.propertyChange()
      }
    }
  },
  created() {
    this.getRole()
    this.getModuleTree()
    this.getChannelTree()
    this.getAlarmDeviceTree()
    this.getFireDeviceTree()
    this.getHelpDeviceTree()
  },
  methods: {
    ...mapActions([
      'getRoleList',
      'addRole',
      'getRoleInfo',
      'editRoleInfo',
      'delRole',
      'getModule',
      'getChannel',
      'searchChannel',
      'getAssign',
      'moveRoleNode',
      'getAlarmDevice',
      'getFireDevice',
      'getHelpDevice'
    ]),
    /**
     * 手动调用bs-scroll的update
     */
    funTreeExpand() {
      this.$refs.funTreeScroll.update()
    },
    systemTreeExpand() {
      this.$refs.systemTreeScroll.update()
    },
    resourceTreeExpand() {
      this.$refs.resourceTreeScroll.update()
    },
    othersTreeExpand() {
      this.$refs.othersTreeScroll.update()
    },
    /**
     * 获取节点图标
     * @method getNodeIcon
     * @param {String} item 节点信息
     */
    getNodeIcon(item) {
      return getNodeIcon(item)
    },
    /**
     * 打开添加角色/复制角色模态框
     * @method operateRole
     * @param {Number} type 0->添加角色 1->复制角色
     */
    operateRole(type) {
      this.modalTitle = type === 0 ? '新建角色' : '复制角色'
      if (this.activeRole === '' && type === 1) {
        this.warningMsg('请选择要复制的角色')
        return
      }
      this.roleShow = true
    },
    /**
     * 关闭添加角色/复制角色模态框
     * @method operateCancel
     * @param {string} name 表单ref
     */
    operateCancel(name) {
      this.$refs[name].resetFields()
      this.roleShow = false
    },
    /**
     * 新建角色和复制角色确认判断
     * @method operateAffirm
     * @param {string} name 表单ref
     */
    operateAffirm(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          if (this.modalTitle === '新建角色') {
            this.addRoleAffirm()
          } else {
            this.copyRoleAffirm()
          }
        } else {
          this.warningMsg('请完善角色名称')
        }
      })
    },
    /**
     * 确认添加角色
     * @method addRoleAffirm
     */
    addRoleAffirm() {
      let data = {
        name: this.roleForm.roleName
      }
      this.addRole(data).then(suc => {
        this.getRole()
        this.successMsg('添加成功')
        this.roleShow = false
      }).catch(err => {
        this.errorMsg(err.message)
      })
    },
    /**
     * 确认复制角色
     * @method copyRoleAffirm
     */
    copyRoleAffirm() {
      let data = {
        name: this.roleForm.roleName,
        id: this.roleList[this.activeRole]._id
      }
      this.addRole(data).then(suc => {
        this.getRole()
        this.successMsg('添加成功')
        this.roleShow = false
      }).catch(err => {
        this.errorMsg(err.message)
      })
    },
    /**
     * 删除角色
     * @method deleteRole
     */
    deleteRole() {
      const id = this.roleList[this.activeRole]._id
      this.$Modal.confirm({
        title: '删除确认',
        content: '<p>确认删除该角色？</p>',
        onOk: () => {
          this.delRole(id).then(suc => {
            this.getRole()
            this.successMsg('删除成功')
          }).catch(err => {
            this.errorMsg(err.message)
            console.log(err.message)
          })
        }
      })
    },
    /**
     * 保存修改后的角色
     * @method saveRoleInfo
     */
    saveRoleInfo(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          this.resCheckNode.map((item, index) => {
            let isOriginal = this.roleInfo['resources'].includes(item.resId)
            if (!isOriginal && item.prop.length === 0) {
              this.resCheckNode.splice(index, 1)
            }
          })
          let actionTreeId = read('actionTreeId')
          let funId = [this.funTree._id, this.sysTree._id]
          let data = {
            _id: this.roleData._id,
            name: this.roleData.name,
            actions: [...this.roleData.funcActions, ...this.roleData.sysActions, ...funId, actionTreeId],
            resource: this.resCheckNode,
            loginType: parseInt(this.roleData.loginType)
          }
          this.editRoleInfo(data).then(suc => {
            this.getRole()
            this.successMsg('保存成功')
            this.resCheckNode = []
            this.propertyArr = []
            this.roleData = {
              _id: '',
              name: '',
              funcActions: [],
              sysActions: [],
              resources: []
            }
          }).catch(err => {
            this.errorMsg(err.message)
          })
        }
      })
    },
    /**
     * 取消复制资源权限属性
     * @method copyPowerCancel
     */
    copyPowerCancel() {
      this.copyPowerShow = false
    },
    /**
     * 确认复制资源权限属性
     * @method copyPowerAffirm
     */
    copyPowerAffirm() {
      let checkNode = this.$refs.othersTree.getSelectedNodes()
      checkNode.map(item => {
        if ('eid' in item) {
          let data = this.searchNode(item._id)
          if (data.length === 0) {
            let checkObject = {
              resId: item._id,
              prop: JSON.parse(JSON.stringify(this.propertyArr))
            }
            this.resCheckNode.push(checkObject)
          } else {
            data[0].prop = JSON.parse(JSON.stringify(this.propertyArr))
          }
          let isSet = this.roleData['resources'].includes(item._id)
          if (isSet && this.propertyArr.length === 0) {
            let index = this.roleData['resources'].indexOf(item._id)
            this.roleData['resources'].splice(index, 1)
          }
          if (!isSet && this.propertyArr.length !== 0) {
            this.roleData['resources'].push(item._id)
          }
        }
      })
      this.copyPowerShow = false
    },
    /**
     * 获取角色
     * @method getRole
     */
    getRole() {
      this.getRoleList().then(suc => {
        this.roleList = JSON.parse(JSON.stringify(this.roleArr))
        this.copySet = true
        this.roleData.name = ''
        this.roleForm.roleName = ''
        this.activeRole = ''
      }).catch(err => {
        console.log(err)
      })
    },
    /**
     * 选中角色
     * @method selectRole
     * @param {Number} index 位置下标
     */
    selectRole(index) {
      let state = this.roleList[index].name === '超级管理员'
      this.disabledFun = state
      this.saveDisabled = false
      this.activeRole = index
      const id = this.roleList[index]._id
      this.resCheckNode = []
      this.propertyArr = []
      this.resChecked = {}
      this.upPower = index === 0
      this.downPower = index === this.roleList.length - 1
      this.propertySetStatus(true)
      this.getRoleDetails(id)
    },
    /**
     * 获取角色权限详情
     * @method getRoleDetails
     * @param {String} id 选中角色ID
     */
    getRoleDetails(id) {
      this.getRoleInfo(id).then(suc => {
        this.roleData = JSON.parse(JSON.stringify(this.roleInfo))
        if (this.roleData.funcActions.length < this.funCount) {
          let funIndex = this.roleData.funcActions.indexOf(this.funTree._id)
          this.roleData.funcActions.splice(funIndex, 1)
        }
        if (this.roleData.sysActions.length < this.sysCount) {
          let sysIndex = this.roleData.sysActions.indexOf(this.sysTree._id)
          this.roleData.sysActions.splice(sysIndex, 1)
        }
      }).catch(err => {
        console.log(err.message)
      })
    },
    /**
     * 获取功能业务模块及系统配置模块树
     * @method getModuleTree
     */
    getModuleTree() {
      this.getModule().then(suc => {
        this.funTree = JSON.parse(JSON.stringify(this.funTreeData))
        this.sysTree = JSON.parse(JSON.stringify(this.sysTreeData))
        this.count = 0
        this.getNodeCount(this.funTree)
        this.funCount = this.count
        this.count = 0
        this.getNodeCount(this.sysTree)
        this.sysCount = this.count
      }).catch(err => {
        console.log(err.message)
      })
    },
    /**
     * 获取功能业务树及系统配置树的节点个数
     * @method getNodeCount
     */
    getNodeCount(data) {
      if (data._id) {
        this.count++
      }
      if (data.children && data.children.length > 0) {
        data.children.forEach(item => this.getNodeCount(item))
      }
    },
    /**
     * 获取选中节点的id集合
     * @method funCheckNode/sysCheckNode
     * @param {Array} data 选中节点的id集合
     */
    funCheckNode(data) {
      this.roleData.funcActions = data
    },
    sysCheckNode(data) {
      this.roleData.sysActions = data
    },
    /**
     * 判断通道是否被配置
     * @method getNodeColor
     * @param {Object} node 节点信息
     */
    getNodeColor(node) {
      if (!node._id) { return '#FFFFFF' }
      this.isColor = false
      let arr = this.roleData['resources']
      this.hasChildColor(node, arr)
      if (this.isColor) {
        return '#00FF00'
      }
      return '#FFFFFF'
    },
    hasChildColor(node, arr) {
      this.isColor = false
      if (this.activeRole !== '' && this.roleList[this.activeRole].name === '超级管理员') {
        if ('eid' in node) {
          this.isColor = true
          return
        }
      }
      if (arr.includes(node._id)) {
        this.isColor = true
        return
      }
      if (node.children && node.children.length > 0) {
        for (let index = 0; index < node.children.length; index++) {
          this.hasChildColor(node.children[index], arr)
          if (this.isColor) { break }
        }
      }
    },
    /**
     * 搜索出的节点选择
     * @method channelClick
     * @param {Object} node 节点信息
     */
    channelClick(node) {
      this.resourceNode(node)
    },
    /**
     * 获取资源树点击时的节点信息
     * @method resourceNode
     * @param {Object} node 节点信息
     */
    resourceNode(node) {
      console.log(node)
      if (this.activeRole === '') { return }
      let state = this.roleList[this.activeRole].name === '超级管理员'
      switch (this.resourceType) {
        case '0':
        case '2':
        case '3':
          if ('eid' in node) {
            this.propertySetStatus(state)
            this.copySet = state
            this.resourceId = node._id
            let nodeArr = this.searchNode(node._id)
            if (nodeArr.length === 0) {
              this.getAssignInfo(node._id)
            } else {
              this.propertyArr = nodeArr[0].prop
            }
          } else {
            this.propertySetStatus(true)
            this.copySet = true
            this.propertyArr = []
          }
          break
        case '1':
          if ('bigtype' in node || 'eid' in node) {
            let othersState = false
            if ('bigtype' in node && node.bigtype === 0 && !state) { // IPC和NVR
              othersState = true
              this.propertySetStatus(true, 0)
            }
            if ('bigtype' in node && node.bigtype === 1 && !state) { // 报警主机
              othersState = true
              this.propertySetStatus(true, 1)
            }
            if ('eid' in node && 'type' in node && node.type === 1 && !state) { // IPC或NVR设备报警输入
              othersState = true
              this.propertySetStatus(true, 2)
            }
            if ('eid' in node && 'type' in node && node.type === 9 && !state) { // 报警主机的报警防区
              othersState = true
              this.propertySetStatus(true, 3)
            }
            if (!othersState && !state) {
              this.propertySetStatus(true)
            }
            if (state) {
              this.copySet = true
            }
            this.copySet = state
            this.resourceId = node._id
            let nodeArr = this.searchNode(node._id)
            if (nodeArr.length === 0) {
              this.getAssignInfo(node._id)
            } else {
              this.propertyArr = nodeArr[0].prop
            }
          } else {
            this.propertySetStatus(true)
            this.copySet = true
            this.propertyArr = []
          }
      }
    },
    /**
     * 资源权限属性禁用状态设置
     * @method propertySetStatus
     * @param {Boolean} status 节点禁用状态
     */
    propertySetStatus(status, type) {
      switch (this.resourceType) {
        case '0':
          this.propertySet = status
          break
        case '1':
          if (!type) {
            for (let item in this.alarmPropertySet) {
              this.alarmPropertySet[item] = status
            }
          } else {
            switch (type) {
              case 0: // IPC和NVR
                for (let item in this.alarmPropertySet) {
                  this.alarmPropertySet[item] = true
                }
                break
              case 1: // 报警主机
                this.alarmPropertySet.receiveSet = false
                this.alarmPropertySet.confireSet = false
                this.alarmPropertySet.alarmCleanSet = false
                this.alarmPropertySet.deploymentSet = false
                this.alarmPropertySet.disarmingSet = false
                this.alarmPropertySet.cleanSet = false
                this.alarmPropertySet.bypassSet = true
                this.alarmPropertySet.removeBypassSet = true
                break
              case 2: // IPC或NVR设备报警输入
                this.alarmPropertySet.receiveSet = false
                this.alarmPropertySet.confireSet = false
                this.alarmPropertySet.alarmCleanSet = false
                this.alarmPropertySet.deploymentSet = true
                this.alarmPropertySet.disarmingSet = true
                this.alarmPropertySet.cleanSet = true
                this.alarmPropertySet.bypassSet = true
                this.alarmPropertySet.removeBypassSet = true
                break
              case 3: // 报警主机的报警防区
                for (let item in this.alarmPropertySet) {
                  this.alarmPropertySet[item] = false
                }
            }
          }
          break
        case '2':
          this.firePropertySet = status
          break
        case '3':
          this.helpPropertySet = status
      }
    },
    /**
     * 确定选中通道的资源权限属性应用批量设置过的数据还是以前的数据
     * @method searchNode
     * @param {String} id 节点id
     */
    searchNode(id) {
      let data = this.resCheckNode.filter(item => {
        return item.resId === id
      })
      return data
    },
    /**
     * 获取已配置镜头资源权限属性
     * @method getAssignInfo
     * @param {String} nodeId 资源ID
     */
    getAssignInfo(nodeId) {
      let data = {
        roleId: this.roleList[this.activeRole]._id,
        resId: nodeId
      }
      this.getAssign(data).then(suc => {
        this.propertyArr = suc.data.properties ? suc.data.properties : []
      }).catch(err => {
        console.log(err.message)
      })
    },
    /**
     * 资源权限属性选择后更新数据
     * @method checkAllGroupChange
     */
    checkAllGroupChange() {
      let data = this.searchNode(this.resourceId)
      let isSet = this.roleData['resources'].includes(this.resourceId)
      if (data.length === 0) {
        this.resCheckNode.push({
          resId: this.resourceId,
          prop: JSON.parse(JSON.stringify(this.propertyArr))
        })
      } else {
        data[0].prop = JSON.parse(JSON.stringify(this.propertyArr))
      }
      if (isSet && this.propertyArr.length === 0) {
        let index = this.roleData['resources'].indexOf(this.resourceId)
        this.roleData['resources'].splice(index, 1)
      }
      if (!isSet && this.propertyArr.length !== 0) {
        this.roleData['resources'].push(this.resourceId)
      }
    },
    /**
     * 功能业务模块及系统配置模块复选
     * @method allCheck
     * @param {String} ref ref
     */
    allCheck(ref) {
      switch (ref) {
        case 'funTree':
          this.$refs.funTree.handlecheckedChange(this.funTree)
          break
        case 'systemTree':
          this.$refs.systemTree.handlecheckedChange(this.sysTree)
      }
    },
    /**
     * 资源数据切换
     * @method resourceChange
     * @param {String} type 当前选中项
     */
    resourceChange(type) {
      switch (type) {
        case '0':
          this.resource = this.resourceData.videoTree
          break
        case '1':
          this.resource = this.resourceData.alarmTree
          break
        case '2':
          this.resource = this.resourceData.fireTree
          break
        case '3':
          this.resource = this.resourceData.helpTree
      }
      this.resChecked = {}
      this.propertyArr = []
      this.copySet = true
      this.propertySetStatus(true)
    },
    /**
     * 移动节点
     * @method moveNode
     * @param {Number} data 0=>上移 1=>下移
     */
    moveNode(type) {
      let data = {
        activeId: this.roleList[this.activeRole]._id,
        replaceId: type === 0 ? this.roleList[this.activeRole - 1]._id : this.roleList[this.activeRole + 1]._id,
        type: 'role'
      }
      this.moveRoleNode(data).then(suc => {
        this.getRole()
        this.upPower = true
        this.downPower = true
      }).catch(err => {
        console.log(err.message)
      })
    },
    /**
     * 获取视频通道资源权限树
     * @method getChannelTree
     */
    getChannelTree() {
      this.getChannel().then(suc => {
        this.resourceData.videoTree = JSON.parse(JSON.stringify(this.channelData))
        this.resource = this.resourceData.videoTree
      }).catch(err => {
        console.log(err.message)
      })
    },
    /**
     * 获取报警设备机构树
     * @method getAlarmDeviceTree
     */
    getAlarmDeviceTree() {
      this.getAlarmDevice().then(suc => {
        this.resourceData.alarmTree = JSON.parse(JSON.stringify(this.alarmDeviceData))
      }).catch(err => {
        console.log(err.message)
      })
    },
    /**
     * 获取消防设备机构树
     * @method getFireDeviceTree
     */
    getFireDeviceTree() {
      this.getFireDevice().then(suc => {
        this.resourceData.fireTree = JSON.parse(JSON.stringify(this.fireDeviceData))
      }).catch(err => {
        console.log(err.message)
      })
    },
    /**
     * 获取报警求助设备机构树
     * @method getHelpDeviceTree
     */
    getHelpDeviceTree() {
      this.getHelpDevice().then(suc => {
        this.resourceData.helpTree = JSON.parse(JSON.stringify(this.helpDeviceData))
      }).catch(err => {
        console.log(err.message)
      })
    },
    /**
     * 资源权限属性切换
     * @method propertyChange
     */
    propertyChange() {
      switch (this.resourceType) {
        case '0':
          return [
            { isDisabled: this.propertySet, labelValue: 'preview', labelName: '视频预览' },
            { isDisabled: this.propertySet, labelValue: 'cloudControl', labelName: '云台控制' },
            { isDisabled: this.propertySet, labelValue: 'playbackDownload', labelName: '录像回放及下载' }
          ]
        case '1':
          return [
            { isDisabled: this.alarmPropertySet.receiveSet, labelValue: 'alarmReceive', labelName: '报警接收' },
            { isDisabled: this.alarmPropertySet.confireSet, labelValue: 'alarmConfirm', labelName: '报警确认' },
            { isDisabled: this.alarmPropertySet.alarmCleanSet, labelValue: 'alarmClean', labelName: '报警清除' },
            { isDisabled: this.alarmPropertySet.deploymentSet, labelValue: 'deployment', labelName: '布防' },
            { isDisabled: this.alarmPropertySet.disarmingSet, labelValue: 'disarming', labelName: '撤防' },
            { isDisabled: this.alarmPropertySet.cleanSet, labelValue: 'clean', labelName: '清除' },
            { isDisabled: this.alarmPropertySet.bypassSet, labelValue: 'bypass', labelName: '旁路' },
            { isDisabled: this.alarmPropertySet.removeBypassSet, labelValue: 'removeBypass', labelName: '撤旁' }
          ]
        case '2':
          return [
            { isDisabled: this.firePropertySet, labelValue: 'alarmReceive', labelName: '报警接收' },
            { isDisabled: this.firePropertySet, labelValue: 'alarmConfirm', labelName: '报警确认' },
            { isDisabled: this.firePropertySet, labelValue: 'alarmClean', labelName: '报警清除' }
          ]
        case '3':
          return [
            { isDisabled: this.helpPropertySet, labelValue: 'alarmReceive', labelName: '报警接收' },
            { isDisabled: this.helpPropertySet, labelValue: 'alarmConfirm', labelName: '报警确认' },
            { isDisabled: this.helpPropertySet, labelValue: 'alarmClean', labelName: '报警清除' }
          ]
      }
    }
  }
}
</script>
<style lang="less" scoped>
.modle-public {
  flex: 0 0 272px;
  margin-right: 16px;
}
.checkbox-public {
  height: 38px;
  line-height: 38px;
  padding-left: 14px;
}
.scroll-public {
  width: 100%;
  height: 100%;
}
.main {
  flex: 1;
  display: flex;
  .role-main {
    width: 100%;
    display: flex;
    flex-direction: row;
    .main-left {
      .modle-public;
      display: flex;
      flex-direction: column;
      background-color: #1b3153;
      .role-top {
        flex: 0 0 40px;
        padding: 8px;
        .ivu-btn-group {
          width: 100%;
          .ivu-btn {
            padding: 0;
            width: 20%;
            height: 24px;
          }
        }
      }
      .role-bottom {
        flex: 1;
        overflow: auto;
        .ul-style {
          padding-bottom: 38px;
          .li-style {
            height: 38px;
            line-height: 38px;
            padding-left: 24px;
            border-bottom: 1px solid rgba(58, 90, 139, 0.4);
            cursor: pointer;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            width: 100%;
            &:hover {
              background-color: #20365c;
            }
          }
          .liActive {
            background-color: #2a436a;
          }
        }
      }
    }
    .main-right {
      flex: 1;
      display: flex;
      flex-direction: row;
      background-color: #1b3153;
      .module-control {
        flex: 0 0 560px;
        display: flex;
        flex-direction: column;
        margin-right: 16px;
        .save-control {
          flex: 0 0 56px;
          padding: 12px 24px;
          .role-style {
            display: inline-block;
            height: 32px;
          }
        }
        .control-style {
          flex: 1;
          display: flex;
          flex-direction: row;
          .fun-control {
            .modle-public;
            display: flex;
            flex-direction: column;
            overflow: auto;
            .funCheck-style {
              .checkbox-public;
              flex: 0 0 38px;
            }
            .fun-tree {
              flex: 1;
              border: 1px solid rgba(58, 90, 139, 0.4);
              .scroll-style {
                .scroll-public;
              }
            }
          }
          .system-control {
            .modle-public;
            display: flex;
            flex-direction: column;
            margin-right: 0;
            overflow: auto;
            .sysCheck-style {
              .checkbox-public;
              flex: 0 0 38px;
            }
            .system-tree {
              flex: 1;
              border: 1px solid rgba(58, 90, 139, 0.4);
              .scroll-style {
                .scroll-public;
              }
            }
          }
        }
      }
      .resource-control {
        flex: 0 0 560px;
        display: flex;
        flex-direction: column;
        .type-sel {
          flex: 0 0 56px;
          line-height: 56px;
        }
        .resource-panel {
          flex: 1;
          display: flex;
          flex-direction: row;
          .resource-main {
            .modle-public;
            display: flex;
            flex-direction: column;
            overflow: auto;
            .resource-title {
              .checkbox-public;
              flex: 0 0 38px;
              .title-style {
                float: left;
              }
              .search-style {
                float: right;
                width: 200px;
              }
            }
            .resource-tree {
              flex: 1;
              border: 1px solid rgba(58, 90, 139, 0.4);
              overflow: auto;
              .scroll-style {
                .scroll-public;
                .resTree-style {
                  overflow: hidden;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                  width: 250px;
                }
              }
            }
          }
          .property-control {
            .modle-public;
            display: flex;
            flex-direction: column;
            margin-right: 0;
            overflow: auto;
            .title-style {
              .checkbox-public;
            }
            .property-content {
              border: 1px solid rgba(58, 90, 139, 0.4);
              padding-bottom: 12px;
              .property-style {
                .check-style {
                  padding-left: 14px;
                  width: 45%;
                  height: 38px;
                  line-height: 38px;
                }
              }
              .copy-btn {
                margin-top: 12px;
                margin-left: 14px;
              }
            }
          }
        }
      }
    }
  }
}
.modal-tree {
  width: 100%;
  height: 460px;
  .modTree-style {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 330px;
  }
}
</style>
