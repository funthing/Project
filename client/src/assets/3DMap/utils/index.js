import { GeometryType } from '../GeometryType.js'
import ALARMTYPE from '../alarmType'
import STATE from '../state.js'
import SymbolConfig from '../SymbolConfig'
import mapUtil from '../mapUtil'
import { toMercator, toWgs84 } from '@turf/projection'
import { point } from '@turf/helpers'
function _getPointModelUrl(res, mode, isEdit) {
  let type = res.device || res.type
  if (type === mapUtil.CHANNELTYPE.vedioResource) {
    if (res.eid && res.eid.type) {
      if (res.eid.type === mapUtil.CHANNELTYPE.alarmColumnResource || res.eid.type === mapUtil.CHANNELTYPE.alarmBoxResource) {
        type = res.eid.type
      }
    }
  }
  let point = {}
  if (type === mapUtil.CHANNELTYPE.assist) {
    point = res
  } else {
    point = res[mode]
  }
  // 获取点位模型的地址
  let modelURI = '/static/model/default.gltf'
  if (point && point.mid && point.mid.files && point.mid.files.length > 0) {
    if (type === mapUtil.CHANNELTYPE.patrol || type === mapUtil.CHANNELTYPE.alarmBoxResource || type === mapUtil.CHANNELTYPE.alarmColumnResource) {
      for (const file of point.mid.files) { // 遍历模型文件获取在线模型地址
        if (file.status === 'online') {
          modelURI = file.path
          break
        }
      }
    } else {
      if (isEdit) {
        for (const file of point.mid.files) { // 遍历模型文件获取在线模型地址
          if (file.status === 'online') {
            modelURI = file.path
            break
          }
        }
      } else {
        let status = ''
        if (typeof (res.status) === 'undefined') {
          status = 'offline'
        } else {
          if (res.status) {
            status = 'online'
          } else {
            status = 'offline'
          }
        }
        for (const file of point.mid.files) { // 遍历模型文件获取在线模型地址
          if (file.status === status) {
            modelURI = file.path
            break
          }
        }
      }
    }
  }
  return modelURI
}
function addEntitysToMap(key, res, mode, context, isEdit = true) {
  let entities = []
  if (res && res.length > 0) {
    res.forEach(item => {
      let type = item.device || item.type
      let url = _getPointModelUrl(item, mode, isEdit)
      if (type === mapUtil.CHANNELTYPE.vedioResource) {
        if (item.eid && item.eid.type) {
          if (item.eid.type === mapUtil.CHANNELTYPE.alarmColumnResource || item.eid.type === mapUtil.CHANNELTYPE.alarmBoxResource) {
            type = item.eid.type
          }
        }
      }
      let point = {}
      if (type === mapUtil.CHANNELTYPE.assist) {
        point = item
      } else {
        point = item[mode]
      }
      let colorParam = {}
      if (point.mid && point.mid.hasOwnProperty('brightness')) {
        colorParam = getModelExtraColorParam(context.Cesium, point.mid.brightness)
      }
      let entity = addEntityModel(context, {
        id: item._id,
        type,
        s3mUrl: url,
        point3D: point,
        colorParam: colorParam
      })
      entities.push(entity)
      mapUtil.entitys[key].push(entity)
    })
  }
  return entities
}

function reomoveEntityById(id, key, context) {
  let _index = -1
  if (id) {
    context.viewer.entities.removeById(id)
  }
  let entitys = mapUtil.entitys[key]
  entitys.forEach((elem, index) => {
    if (elem.id === id) {
      _index = index
    }
  })
  if (_index) {
    entitys.splice(_index, 1)
  }
}

function reomoveAllEntitys(context) {
  for (let key in mapUtil.entitys) {
    let entitys = mapUtil.entitys[key]
    entitys.forEach(entity => {
      context.viewer.entities.remove(entity)
    })
    entitys = []
  }
}

function getExtent(arr0, arr1) {
  let rat = 0.01
  let ratArea = [arr1[0] * rat, arr1[1] * rat]
  let a0 = arr0[0] - ratArea[0] / 2
  let b0 = arr0[1] - ratArea[1] / 2
  let a1 = arr0[0] + ratArea[0] / 2
  let b1 = arr0[1] + ratArea[1] / 2
  let newArea = [a0, b0, a1, b1]
  return newArea
}

function addSingleModel(context, model) {
  let { id, type, url, longitude, latitude, height, heading, pitch, roll, scale, minimumPixelSize, color, colorAmount } = model
  let entity = null
  if (context.viewer.entities.getById(id)) {
    entity = context.viewer.entities.getById(id)
  } else {
    minimumPixelSize = minimumPixelSize || 10
    let position = context.Cesium.Cartesian3.fromDegrees(longitude, latitude, height) // 构造位置信息
    let headingRadians = context.Cesium.Math.toRadians(heading) // 朝向角度转换为弧度
    let pitchRadians = context.Cesium.Math.toRadians(pitch) // 俯仰角度转换为弧度
    let rollRadians = context.Cesium.Math.toRadians(roll) // 滚动角度角度转换为弧度
    let hpr = new context.Cesium.HeadingPitchRoll(headingRadians, pitchRadians, rollRadians) // 构造朝向、俯仰、滚动角度数据
    let orientation = context.Cesium.Transforms.headingPitchRollQuaternion(position, hpr) // 构造视角数据
    let modelParams = {
      uri: url,
      minimumPixelSize: minimumPixelSize,
      maximumScale: 128,
      scale: scale,
      // distanceDisplayCondition: new context.Cesium.DistanceDisplayCondition(mapUtil.TDDEFAULTOPS.entityMinShowHeight, mapUtil.TDDEFAULTOPS.entityMaxShowHeight), // 设置实体模型显示范围
      color: color || context.Cesium.Color.WHITE, // 模型渲染色
      colorBlendMode: context.Cesium.ColorBlendMode.MIX, // 模型颜色渲染的方式
      colorBlendAmount: colorAmount || 0 // 模型颜色渲染的方式mix（混合）时，渲染颜色数量（0-1.0）
    }
    entity = context.viewer.entities.add({
      id: id,
      name: type,
      position: position, // 位置数据
      orientation: orientation, // 视角数据
      model: modelParams
    })
  }
  return entity
}

function addLabel(context, position, name) {
  const { lon, lat, height } = position
  let entity = context.viewer.entities.add({
    id: name,
    position: context.Cesium.Cartesian3.fromDegrees(lon, lat, height + 10),
    label: {
      text: name,
      showBackground: true,
      font: '20px sans-serif',
      backgroundColor: context.Cesium.Color.fromCssColorString('rgba(24,44,76,0.5)'),
      style: context.Cesium.LabelStyle.FILL_AND_OUTLINE
      // pixelOffset: new context.Cesium.Cartesian2(0, -30) // 设置label像素偏移
    }
  })
  return entity
}

function clearAllSelectedEntity(context) {
  let entities = context.viewer.entities.values
  entities.forEach(entity => {
    entity.model.color = context.Cesium.Color.WHITE
  })
}

function selectedEntity(context, id) {
  let entity = context.viewer.entities.getById(id)
  entity.model.color = context.Cesium.Color.RED
}
/**
 * 添加正在报警的巡更点位
 * @param {*} param 推送的报警信息
 */
function addAlarmingFea(param, type) {
  let geo
  let ids
  if (param.map3D) {
    geo = param.map3D.geo.split(',').map(item => Number(item))
    ids = param._id
  } else if (param.alarmInfo.point3D) {
    geo = param.alarmInfo.point3D.loc
    ids = param.alarmInfo.channelId
  } else if (param.alarmInfo.bondCarmerRes) {
    geo = param.alarmInfo.bondCarmerRes.point3D.loc
    ids = param.alarmInfo.bondCarmerRes._id
  }
  if (geo) {
    let id = ids
    let loc = geo
    let patrolFeature = {
      geom: {
        type: GeometryType.POINT,
        points: loc
      },
      attributes: {
        id,
        type: param.type,
        alarmType: ALARMTYPE.PATROL,
        state: STATE.ALARMIMG,
        loc
      },
      symbol: SymbolConfig[type]
    }
    return patrolFeature
  }
}

/**
 * 改变模型的离地高度
 * @param {*} context 三维地图数据
 * @param {*} entityId 实体标识
 * @param {*} modelURI 模型文件地址
 */
function changeModelURI(context, entityId, modelURI) {
  let entity = context.viewer.entities.getById(entityId) // 获取当前实体对象
  if (entity) {
    entity.model.uri = modelURI
  }
}

/**
 * 改变模型的大小
 * @param {*} context 三维地图数据
 * @param {*} entityId 实体标识
 * @param {*} point3D 点位数据
 */
function changeModelScale(context, entityId, point3D) {
  let entity = context.viewer.entities.getById(entityId)
  if (entity) {
    entity.model.scale = point3D.scale
  }
}

/**
 * 改变模型的高度
 * @param {*} context 三维地图数据
 * @param {*} entityId 实体标识
 * @param {*} point3D 点位数据
 */
function changeModelHeight(context, entityId, point3D) {
  let entity = context.viewer.entities.getById(entityId) // 获取当前实体对象
  let coValues = []
  if (entity) {
    let loc = point3D.geo || point3D.loc // 更新位置信息
    if (loc) {
      coValues = loc.split(',').map(item => Number(item)) // 三维坐标
      if (coValues && coValues.length > 0) {
        coValues[2] = point3D.height
        let pos = context.Cesium.Cartesian3.fromDegrees(coValues[0], coValues[1], point3D.height) // 位置的世界坐标
        let heading = context.Cesium.Math.toRadians(point3D.heading) // 朝向角度转换为弧度
        let pitch = context.Cesium.Math.toRadians(point3D.pitch) // 俯仰角度转换为弧度
        let roll = context.Cesium.Math.toRadians(point3D.roll) // 滚动角度角度转换为弧度
        let hpr = new context.Cesium.HeadingPitchRoll(heading, pitch, roll) // 构造偏转角度数据
        entity.position = pos // 改变实体的位置
        entity.orientation = context.Cesium.Transforms.headingPitchRollQuaternion(pos, hpr) // 修改实体的方向
      }
    }
  }
  return coValues
}

/**
 * 改变模型的角度
 * @param {*} context 三维地图数据
 * @param {*} entityId 实体标识
 * @param {*} point3D 点位数据
 */
function changeModelHeadingPitchRoll(context, entityId, point3D) {
  let entity = context.viewer.entities.getById(entityId) // 获取当前实体对象
  if (entity) {
    let pos = entity.position._value // 获取当前实体的位置
    let heading = context.Cesium.Math.toRadians(point3D.heading) // 朝向角度转换为弧度
    let pitch = context.Cesium.Math.toRadians(point3D.pitch) // 俯仰角度转换为弧度
    let roll = context.Cesium.Math.toRadians(point3D.roll) // 滚动角度角度转换为弧度
    let hpr = new context.Cesium.HeadingPitchRoll(heading, pitch, roll) // 构造偏转角度数据
    entity.orientation = context.Cesium.Transforms.headingPitchRollQuaternion(pos, hpr) // 修改实体的方向
  }
}

/**
 * 改变模型的属性
 * @param {*} context 三维地图数据
 * @param {*} entityId 实体标识
 * @param {*} point3D 点位数据
 */
function changeEntityOps(context, entityId, point3D) {
  changeModelHeight(context, entityId, point3D) // 改变模型的离地高度
  changeModelScale(context, entityId, point3D) // 改变模型的大小
  changeModelHeadingPitchRoll(context, entityId, point3D) // 改变模型的角度
}

/**
 * 改变模型的位置
 * @param {*} context 三维地图数据
 * @param {*} entityId 实体标识
 * @param {*} point3D 点位数据
 */
function changeEntityPosition(context, entityId, point3D) {
  let entity = context.viewer.entities.getById(entityId) // 获取当前实体对象
  if (entity) {
    let loc = point3D.geo || point3D.loc // 更新位置信息
    if (loc) {
      let coValues = loc.split(',').map(item => Number(item)) // 三维坐标
      let pos = context.Cesium.Cartesian3.fromDegrees(coValues[0], coValues[1], coValues[2]) // 位置的世界坐标
      let heading = context.Cesium.Math.toRadians(point3D.heading) // 朝向角度转换为弧度
      let pitch = context.Cesium.Math.toRadians(point3D.pitch) // 俯仰角度转换为弧度
      let roll = context.Cesium.Math.toRadians(point3D.roll) // 滚动角度角度转换为弧度
      let hpr = new context.Cesium.HeadingPitchRoll(heading, pitch, roll) // 构造偏转角度数据
      entity.position = pos // 改变实体的位置
      entity.orientation = context.Cesium.Transforms.headingPitchRollQuaternion(pos, hpr) // 修改实体的方向
    }
  }
}

/**
 * 添加实体模型
 * @param {*} context
 * @param {*} resourceObj
 */
function addEntityModel(context, resourceObj) {
  let {id, s3mUrl, type, point3D, colorParam} = resourceObj
  let loc = point3D.geo || point3D.loc // 更新位置信息
  let entity = null
  if (loc) {
    let coValues = loc.split(',').map(item => Number(item)) // 三维坐标
    if (coValues && coValues.length > 0) {
      entity = addSingleModel(context, { // 重新添加点位
        id: id, // 标识
        type: type, // 点位类型
        url: s3mUrl, // 模型地址
        longitude: coValues[0], // 经度
        latitude: coValues[1], // 纬度
        height: coValues[2], // 高度
        heading: point3D.heading, // 朝向角
        pitch: point3D.pitch, // 俯仰角
        roll: point3D.roll, // 滚动角
        scale: point3D.scale, // 模型大小
        color: colorParam.hasOwnProperty('color') ? colorParam.color : context.Cesium.Color.WHITE,
        colorAmount: colorParam.hasOwnProperty('amount') ? colorParam.amount : 0
      })
    }
  }
  return entity
}

/**
 * 格式化经纬度显示信息
 * @param {*} loc 经纬度坐标字符串
 * @returns 格式化后的经纬度坐标字符串
 */
function formatLoc(loc) { // 将经纬度高度信息格式化
  let result = ''
  if (loc) {
    let coValues = loc.split(',')
    for (const val of coValues) {
      result += parseFloat(val.trim()).toFixed(3) + ', '
    }
    result = result.substring(0, result.length - 2)
  }
  return result
}
/**
   * @msg: 报警点位视角移动
   * @param id：报警点位id
   * @param loc：点位位置
   * @return:
   */
function focueOnALarm(id, context) {
  let entity = getEntity(id, context)
  if (entity) {
    locateEntityIn3DMap(context, entity)
  }
}
/**
 * @msg: 获取3d模型实例
 * @param id：实例id
 * @param context：3d底图全局对象
 * @return:
 */
function getEntity(id, context) {
  let entity = null
  let entities = context.viewer.entities
  if (id) {
    entity = entities.getById(id)
  }
  return entity
}

/**
 * 3D地图中定位到实体的位置
 * @param {*} context
 * @param {*} entity 实体
 */
function locateEntityIn3DMap(context, entity) {
  let { viewer, Cesium } = context
  let headingRadians = Cesium.Math.toRadians(mapUtil.TDDEFAULTOPS.locateHeading) // 朝向角度转换为弧度
  let pitchRadians = Cesium.Math.toRadians(mapUtil.TDDEFAULTOPS.locatePitch) // 俯仰角度转换为弧度
  let locateHeight = mapUtil.TDDEFAULTOPS.locateHeight // 定位高度
  let offset = new Cesium.HeadingPitchRange(headingRadians, pitchRadians, locateHeight)
  viewer.zoomTo(entity, offset)
}

/**
 * 重置实体模型
 * @param {*} context
 * @param {*} entityId 实体标识
 * @param {*} point3D 点位数据
 */
function resetPointEntity(context, entityId, point3D) { // 重置点位实体模型
  if (point3D.mid) { // 还原模型
    if (point3D.mid.files && point3D.mid.files.length > 0) {
      let modelURI = point3D.mid.files[0].path // 模型文件的地址
      for (const file of point3D.mid.files) { // 获取在线模型文件的地址
        if (file.status === 'online') {
          modelURI = file.path
        }
      }
      changeEntityOps(context, entityId, point3D) // 还原模型属性
      changeModelURI(context, entityId, modelURI)
    }
  }
}

/**
 * 模型x、y方向位移改变
 * @param {*} context 三维地图数据
 * @param {*} entityId 实体标识
 * @param {*} point3D 点位数据
 */
function changeModelMoveDelta(context, entityId, point3D, delta) {
  let coValues = []
  let entity = context.viewer.entities.getById(entityId) // 获取当前实体对象
  if (entity) {
    let loc = point3D.geo || point3D.loc // 位移参照坐标
    if (loc && delta.refLoc) {
      coValues = loc.split(',').map(item => Number(item)) // 三维坐标
      let refCoValues = delta.refLoc.split(',').map(item => Number(item)) // 三维坐标
      let mercatorCo = toMercator(point([refCoValues[0], refCoValues[1]])).geometry.coordinates // 转换为墨卡托米坐标
      mercatorCo[0] += delta.x
      mercatorCo[1] += delta.y
      let wgs84Co = toWgs84(mercatorCo) // 转换为经纬度
      coValues[0] = wgs84Co[0]
      coValues[1] = wgs84Co[1]
      let pos = context.Cesium.Cartesian3.fromDegrees(coValues[0], coValues[1], coValues[2]) // 位置的世界坐标
      let heading = context.Cesium.Math.toRadians(point3D.heading) // 朝向角度转换为弧度
      let pitch = context.Cesium.Math.toRadians(point3D.pitch) // 俯仰角度转换为弧度
      let roll = context.Cesium.Math.toRadians(point3D.roll) // 滚动角度角度转换为弧度
      let hpr = new context.Cesium.HeadingPitchRoll(heading, pitch, roll) // 构造偏转角度数据
      entity.position = pos // 改变实体的位置
      entity.orientation = context.Cesium.Transforms.headingPitchRollQuaternion(pos, hpr) // 修改实体的方向
    }
  }
  return coValues
}

function getModelExtraColorParam(CesiumLib, brightness) {
  let param = {
    color: brightness >= 0 ? CesiumLib.Color.WHITE : CesiumLib.Color.BLACK,
    amount: Math.abs(brightness)
  }
  return param
}

export default {
  addLabel,
  getExtent,
  addSingleModel,
  clearAllSelectedEntity,
  selectedEntity,
  addAlarmingFea,
  changeModelURI,
  changeModelScale,
  changeModelHeadingPitchRoll,
  addEntityModel,
  changeEntityOps,
  changeEntityPosition,
  changeModelHeight,
  formatLoc,
  addEntitysToMap,
  reomoveEntityById,
  reomoveAllEntitys,
  focueOnALarm,
  getEntity,
  locateEntityIn3DMap,
  resetPointEntity,
  changeModelMoveDelta,
  getModelExtraColorParam
}
