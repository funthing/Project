<template>
  <div ref="aaa" :style="{ width: width,height:height}">
  </div>
</template>

<script>
// import echarts from 'echarts'
export default {
  name: 'BSechart',
  props: {
    options: {},
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '100%'
    }
  },
  data() {
    return {
      chart: null
    }
  },
  methods: {
    drawPie(el) {
      this.chart = this.$echarts.init(el)
      this.$chartList.push(this.chart)
      if (this.options) {
        this.chart.setOption(this.options)
      } else {
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.drawPie(this.$el)
    })
  },
  beforeDestroy() {
    this.chart.dispose()
    this.chart = null
    this.$chartList.pop()
  },
  watch: {
    options: {
      handler: function(val) {
        if (this.chart) {
          this.chart.clear()
          this.chart.setOption(val)
        }
      },
      deep: true
    }
  }
}
</script>
