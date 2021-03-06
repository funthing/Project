/**
 * 抓图计划路由
 * @time:207-6-20
 * @author:hansen
 */
'use strict'

const router = require('koa-router')()
const controller = require('./snapshot.controller')

router.get('/', controller.index)
router.put('/', controller.batchUpdate)

module.exports = router
