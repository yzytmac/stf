var program = require('commander')

var pkg = require('../package')
var cliutil = require('./util/cliutil')
var procutil = require('./util/procutil')
var logger = require('./util/logger')

program
  .version(pkg.version)

program
  .command('provider [serial..]')
  .description('start provider')
  .option('-s, --connect-sub <endpoint>'
    , 'sub endpoint'
    , cliutil.list)
  .option('-p, --connect-push <endpoint>'
    , 'push endpoint'
    , cliutil.list)
  .action(function() {
    var serials = cliutil.allUnknownArgs(arguments)
      , options = cliutil.lastArg(arguments)

    if (!options.connectSub) {
      this.missingArgument('--connect-sub')
    }
    if (!options.connectPush) {
      this.missingArgument('--connect-push')
    }

    require('./roles/provider')({
      filter: function(device) {
        return serials.length === 0 || serials.indexOf(device.id) !== -1
      }
    , fork: function(device) {
        var fork = require('child_process').fork
        return fork(__filename, [
          'device', device.id
        , '--connect-sub', options.connectSub.join(',')
        , '--connect-push', options.connectPush.join(',')
        ])
      }
    , endpoints: {
        sub: options.connectSub
      , push: options.connectPush
      }
    })
  })

program
  .command('device <serial>')
  .description('start device worker')
  .option('-s, --connect-sub <endpoint>'
    , 'sub endpoint'
    , cliutil.list)
  .option('-p, --connect-push <endpoint>'
    , 'push endpoint'
    , cliutil.list)
  .action(function(serial, options) {
    if (!options.connectSub) {
      this.missingArgument('--connect-sub')
    }
    if (!options.connectPush) {
      this.missingArgument('--connect-push')
    }

    require('./roles/device')({
      serial: serial
    , endpoints: {
        sub: options.connectSub
      , push: options.connectPush
      }
    })
  })

program
  .command('coordinator <name>')
  .description('start coordinator')
  .option('-a, --connect-app-dealer <endpoint>'
    , 'app dealer endpoint'
    , cliutil.list)
  .option('-d, --connect-dev-dealer <endpoint>'
    , 'device dealer endpoint'
    , cliutil.list)
  .action(function(name, options) {
    if (!options.connectAppDealer) {
      this.missingArgument('--connect-app-dealer')
    }
    if (!options.connectDevDealer) {
      this.missingArgument('--connect-dev-dealer')
    }

    require('./roles/coordinator')({
      name: name
    , endpoints: {
        appDealer: options.connectAppDealer
      , devDealer: options.connectDevDealer
      }
    })
  })

program
  .command('triproxy <name>')
  .description('start triproxy')
  .option('-u, --bind-pub <endpoint>'
    , 'pub endpoint'
    , String
    , 'tcp://*:7111')
  .option('-d, --bind-dealer <endpoint>'
    , 'dealer endpoint'
    , String
    , 'tcp://*:7112')
  .option('-p, --bind-pull <endpoint>'
    , 'pull endpoint'
    , String
    , 'tcp://*:7113')
  .action(function(name, options) {
    require('./roles/triproxy')({
      name: name
    , endpoints: {
        pub: options.bindPub
      , dealer: options.bindDealer
      , pull: options.bindPull
      }
    })
  })

program
  .command('auth-ldap')
  .description('start LDAP auth client')
  .option('-p, --port <port>'
    , 'port (or $PORT)'
    , Number
    , 7100)
  .option('-s, --secret <secret>'
    , 'secret (or $SECRET)'
    , String)
  .option('-i, --ssid <ssid>'
    , 'session SSID (or $SSID)'
    , String
    , 'ssid')
  .option('-u, --ldap-url <url>'
    , 'LDAP server URL (or $LDAP_URL)'
    , String)
  .option('-t, --ldap-timeout <timeout>'
    , 'LDAP timeout (or $LDAP_TIMEOUT)'
    , Number
    , 1000)
  .option('--ldap-bind-dn <dn>'
    , 'LDAP bind DN (or $LDAP_BIND_DN)'
    , String)
  .option('--ldap-bind-credentials <credentials>'
    , 'LDAP bind credentials (or $LDAP_BIND_CREDENTIALS)'
    , String)
  .option('--ldap-search-dn <dn>'
    , 'LDAP search DN (or $LDAP_SEARCH_DN)'
    , String)
  .option('--ldap-search-scope <scope>'
    , 'LDAP search scope (or $LDAP_SEARCH_SCOPE)'
    , String
    , 'sub')
  .option('--ldap-search-class <class>'
    , 'LDAP search objectClass (or $LDAP_SEARCH_CLASS)'
    , String
    , 'user')
  .action(function(options) {
    var env = process.env
    require('./roles/auth/ldap')({
      port: env.PORT || options.port
    , secret: options.secret || env.SECRET
    , ssid: options.ssid || env.SSID
    , ldap: {
        url: options.ldapUrl || env.LDAP_URL
      , timeout: options.ldapTimeout || env.LDAP_TIMEOUT
      , bind: {
          dn: options.ldapBindDn || env.LDAP_BIND_DN
        , credentials: options.ldapBindCredentials || env.LDAP_BIND_CREDENTIALS
        }
      , search: {
          dn: options.ldapSearchDn || env.LDAP_SEARCH_DN
        , scope: options.ldapSearchScope || env.LDAP_SEARCH_SCOPE
        , objectClass: options.ldapSearchClass || env.LDAP_SEARCH_CLASS
        , loginField: options.ldapSearchLoginField || env.LDAP_SEARCH_LOGINFIELD
        }
      }
    })
  })


program
  .command('auth-mock')
  .description('start mock auth client')
  .option('-p, --port <port>'
    , 'port (or $PORT)'
    , Number
    , 7100)
  .option('-s, --secret <secret>'
    , 'secret (or $SECRET)'
    , String)
  .option('-i, --ssid <ssid>'
    , 'session SSID (or $SSID)'
    , String
    , 'ssid')
  .action(function(options) {
    var env = process.env
    require('./roles/auth/mock')({
      port: env.PORT || options.port
    , secret: options.secret || env.SECRET
    , ssid: options.ssid || env.SSID
    })
  })

program
  .command('console')
  .description('start console')
  .option('-s, --connect-sub <endpoint>'
    , 'sub endpoint'
    , cliutil.list)
  .option('-p, --connect-push <endpoint>'
    , 'push endpoint'
    , cliutil.list)
  .action(function(options) {
    if (!options.connectSub) {
      this.missingArgument('--connect-sub')
    }
    if (!options.connectPush) {
      this.missingArgument('--connect-push')
    }

    require('./roles/console')({
      endpoints: {
        sub: options.connectSub
      , push: options.connectPush
      }
    })
  })

program
  .command('local [serial..]')
  .description('start everything locally')
  .option('--bind-app-pub <endpoint>'
    , 'app pub endpoint'
    , String
    , 'tcp://127.0.0.1:7111')
  .option('--bind-app-dealer <endpoint>'
    , 'app dealer endpoint'
    , String
    , 'tcp://127.0.0.1:7112')
  .option('--bind-app-pull <endpoint>'
    , 'app pull endpoint'
    , String
    , 'tcp://127.0.0.1:7113')
  .option('--bind-dev-pub <endpoint>'
    , 'device pub endpoint'
    , String
    , 'tcp://127.0.0.1:7114')
  .option('--bind-dev-dealer <endpoint>'
    , 'device dealer endpoint'
    , String
    , 'tcp://127.0.0.1:7115')
  .option('--bind-dev-pull <endpoint>'
    , 'device pull endpoint'
    , String
    , 'tcp://127.0.0.1:7116')
  .action(function() {
    var log = logger.createLogger('cli')
    var options = cliutil.lastArg(arguments)

    // app triproxy
    procutil.fork(__filename, [
        'triproxy', 'app001'
      , '--bind-pub', options.bindAppPub
      , '--bind-dealer', options.bindAppDealer
      , '--bind-pull', options.bindAppPull
      ])
      .catch(function(err) {
        log.error('app triproxy died', err.stack)
      })

    // device triproxy
    procutil.fork(__filename, [
        'triproxy', 'dev001'
      , '--bind-pub', options.bindDevPub
      , '--bind-dealer', options.bindDevDealer
      , '--bind-pull', options.bindDevPull
      ])
      .catch(function(err) {
        log.error('device triproxy died', err.stack)
      })

    // coordinator one
    procutil.fork(__filename, [
        'coordinator', 'coord001'
      , '--connect-app-dealer', options.bindAppDealer
      , '--connect-dev-dealer', options.bindDevDealer
      ])
      .catch(function(err) {
        log.error('coordinator 001 died', err.stack)
      })

    // coordinator two
    procutil.fork(__filename, [
        'coordinator', 'coord002'
      , '--connect-app-dealer', options.bindAppDealer
      , '--connect-dev-dealer', options.bindDevDealer
      ])
      .catch(function(err) {
        log.error('coordinator 002 died', err.stack)
      })

    // provider
    procutil.fork(__filename, [
        'provider'
      , '--connect-sub', options.bindDevPub
      , '--connect-push', options.bindDevPull
      ].concat(cliutil.allUnknownArgs(arguments)))
      .catch(function(err) {
        log.error('provider died', err.stack)
      })
  })

program.parse(process.argv)