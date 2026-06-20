export default defineAppConfig({
  pages: [
    'pages/bind/index',
    'pages/monitor/index',
    'pages/records/index',
    'pages/alert-detail/index',
    'pages/feedback/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0D1B2A',
    navigationBarTitleText: '夜间守护',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0D1B2A'
  },
  tabBar: {
    color: '#78909C',
    selectedColor: '#1E88E5',
    backgroundColor: '#1B2A3A',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/bind/index',
        text: '车辆绑定'
      },
      {
        pagePath: 'pages/monitor/index',
        text: '状态监控'
      },
      {
        pagePath: 'pages/records/index',
        text: '处置记录'
      }
    ]
  }
})
