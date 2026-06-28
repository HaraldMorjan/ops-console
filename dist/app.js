Ext.onReady(function () {
  Ext.tip.QuickTipManager.init()

  var regions = ['US-East', 'US-West', 'EU-West', 'APAC']
  var services = ['Auth API', 'Billing', 'Search', 'CDN', 'Queue', 'Analytics']
  var statuses = ['healthy', 'degraded', 'down']

  function makeRecords() {
    var data = []
    for (var i = 1; i <= 48; i++) {
      var status = statuses[Math.floor(Math.random() * 3)]
      data.push({
        id: i,
        service: services[i % services.length],
        region: regions[i % regions.length],
        status: status,
        latency: status === 'down' ? 0 : 20 + Math.floor(Math.random() * 180),
        uptime: status === 'down' ? 94.2 : 99 + Math.random(),
        requests: Math.floor(Math.random() * 90000) + 5000,
        owner: ['Platform', 'SRE', 'Backend', 'Infra'][i % 4],
        notes: status === 'healthy' ? 'All checks passing' : status === 'degraded' ? 'Elevated latency — investigating' : 'Pager triggered — failover active',
      })
    }
    return data
  }

  var store = Ext.create('Ext.data.Store', {
    fields: ['id', 'service', 'region', 'status', 'latency', 'uptime', 'requests', 'owner', 'notes'],
    groupField: 'region',
    sorters: [{ property: 'service', direction: 'ASC' }],
    data: makeRecords(),
  })

  function statusRenderer(val) {
    var cls = val === 'healthy' ? 'ops-ok' : val === 'degraded' ? 'ops-warn' : 'ops-err'
    return '<span class="ops-badge ' + cls + '">' + val + '</span>'
  }

  var grid = Ext.create('Ext.grid.Panel', {
    title: 'Service health',
    store: store,
    flex: 2,
    features: [{ ftype: 'grouping', groupHeaderTpl: 'Region: {name} ({rows.length} services)' }],
    columns: [
      { text: 'Service', dataIndex: 'service', flex: 1, filter: { type: 'string' } },
      { text: 'Region', dataIndex: 'region', width: 100, filter: { type: 'list' } },
      { text: 'Status', dataIndex: 'status', width: 110, renderer: statusRenderer, filter: { type: 'list' } },
      { text: 'Latency (ms)', dataIndex: 'latency', width: 110, align: 'right' },
      { text: 'Uptime %', dataIndex: 'uptime', width: 100, align: 'right', renderer: function (v) { return v.toFixed(2) } },
      { text: 'Req/min', dataIndex: 'requests', width: 100, align: 'right', renderer: Ext.util.Format.numberRenderer('0,0') },
      { text: 'Owner', dataIndex: 'owner', width: 90 },
    ],
    plugins: 'gridfilters',
    listeners: {
      selectionchange: function (sm, selected) {
        detailPanel.updateDetail(selected[0])
      },
    },
  })

  var detailPanel = Ext.create('Ext.panel.Panel', {
    title: 'Incident detail',
    flex: 1,
    bodyPadding: 12,
    html: '<p style="color:#666;margin:0">Select a row to view details.</p>',
    updateDetail: function (rec) {
      if (!rec) {
        this.update('<p style="color:#666;margin:0">Select a row to view details.</p>')
        return
      }
      var html =
        '<h3 style="margin:0 0 8px">' + rec.get('service') + ' · ' + rec.get('region') + '</h3>' +
        '<p><strong>Status:</strong> ' + statusRenderer(rec.get('status')) + '</p>' +
        '<p><strong>Latency:</strong> ' + rec.get('latency') + ' ms</p>' +
        '<p><strong>Uptime:</strong> ' + rec.get('uptime').toFixed(2) + '%</p>' +
        '<p><strong>Requests/min:</strong> ' + Ext.util.Format.number(rec.get('requests'), '0,0') + '</p>' +
        '<p><strong>Owner:</strong> ' + rec.get('owner') + '</p>' +
        '<p><strong>Notes:</strong> ' + rec.get('notes') + '</p>'
      this.update(html)
    },
  })

  Ext.create('Ext.container.Viewport', {
    layout: { type: 'vbox', align: 'stretch' },
    items: [
      {
        xtype: 'toolbar',
        padding: '8 12',
        items: [
          { xtype: 'component', html: '<strong style="font-size:16px">Operations Console</strong> <span style="color:#666;margin-left:8px">Ext JS Classic · Grid · Grouping · Filters</span>' },
          '->',
          {
            text: 'Refresh data',
            handler: function () {
              store.loadData(makeRecords())
            },
          },
          {
            text: 'Export CSV',
            handler: function () {
              var csv = ['Service,Region,Status,Latency,Uptime,Requests,Owner']
              store.each(function (r) {
                csv.push([r.get('service'), r.get('region'), r.get('status'), r.get('latency'), r.get('uptime').toFixed(2), r.get('requests'), r.get('owner')].join(','))
              })
              var blob = new Blob([csv.join('\n')], { type: 'text/csv' })
              var a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'ops-export.csv'
              a.click()
            },
          },
        ],
      },
      {
        xtype: 'panel',
        flex: 1,
        layout: { type: 'hbox', align: 'stretch' },
        items: [grid, detailPanel],
      },
    ],
  })
})
