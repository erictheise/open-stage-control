var path = require('path'),
    ipc = require('../server').ipc,
    settings = require('../settings'),
    tcpInPort = settings.read('tcpInPort'),
    debug = settings.read('debug'),
    vm = require('vm'),
    fs = require('fs'),
    midi = settings.read('midi') ? require('../midi') : false,
    oscUDPServer = require('./udp'),
    oscTCPServer = require('./tcp'),
    EventEmitter = require('events').EventEmitter


if (midi) midi = new midi()

class OscServer {

    constructor(){

        this.customModuleEventEmitter = new EventEmitter()
        this.customModule = (()=>{

            var customModule = settings.read('customModule')
            if (!customModule) return false

            // consolidate path containing whitespaces
            if (!customModule[0].includes('.js')) {
                var index = customModule.findIndex(x => typeof x === 'string' && x.includes('.js'))
                if (index !== undefined) {
                    var _path = customModule.slice(0, index + 1).join(' ')
                    customModule.splice(0, index + 1, _path)
                }
            }

            var file = (()=>{
                    try {
                        return fs.readFileSync(customModule[0], 'utf8')
                    } catch(err) {
                        console.log('CustomModule Error: File not found: ' + customModule[0])
                        return false
                    }
                })(),
                mod,
                context = vm.createContext({
                    console,
                    sendOsc: this.sendOsc.bind(this),
                    receiveOsc: this.receiveOsc.bind(this),
                    send: (host, port, address, ...args)=>{
                        this.sendOsc({host, port, address, args:args.map(x=>this.parseArg(x))})
                    },
                    receive: (host, port, address, ...args)=>{
                        if (host[0] === '/') {
                            // host and port can be skipped
                            if (address !== undefined) args.unshift(address)
                            if (port !== undefined) args.unshift(port)
                            address = host
                            host = port = undefined
                        }
                        this.receiveOsc({host, port, address, args:args.map(x=>this.parseArg(x))})
                    },
                    loadJSON: (url)=>{
                        if (url.split('.').pop() === 'json') {
                            try {
                                url = path.resolve(path.dirname(customModule[0]), url)
                                return JSON.parse(fs.readFileSync(url, 'utf8'))
                            } catch(e) {
                                console.error('ERROR: could not load json file from ' + url)
                                console.error(e.message)
                            }
                        } else {
                            console.error('ERROR: unauthorized file type for loadJSON')
                        }
                    },
                    saveJSON: (url, data)=>{
                        if (url.split('.').pop() === 'json') {
                            url = path.resolve(path.dirname(customModule[0]), url)
                            try {
                                return fs.writeFileSync(url, JSON.stringify(data, null, '  '))
                            } catch(e) {
                                console.error('ERROR: could not save json file to ' + url)
                                console.error(e.message)
                            }
                        } else {
                            console.error('ERROR: unauthorized file type for saveJSON')
                        }
                    },
                    app: this.customModuleEventEmitter,
                    setTimeout, clearTimeout,
                    setInterval, clearInterval,
                    settings,
                    options: customModule.slice(1, customModule.length),
                    module: {},
                })

            try {
                // remove require function (not needed at runtime)
                // wrong: this.constructor.constructor("return process")().mainModule.require
                process.mainModule.require = process.dlopen = null
                // run
                mod = vm.runInContext(file, context, {
                    filename: customModule[0]
                })
                if (context.module.exports) mod = context.module.exports
            } catch(err) {
                console.error(err)
                return false
            }

            return mod

        })()


    }

    parseType(type){
        var t = type[0].match(/[bhtdscrmifTFNI]/)

        if (t!==null) {
            return t[0]
        } else {
            return 's'
        }

    }

    parseArg(arg, precision){
        if (arg==null) return null
        switch (typeof arg) {
            case 'number':
                var typeTagMatch = typeof precision == 'string' ? precision.match(/[0-9]+([a-zA-Z]{1})/) : null,
                    typeTag = typeTagMatch === null ? precision === 0 ? 'i' : 'f' : typeTagMatch[1],
                    precisionValue = parseFloat(precision) || 0

                return {type: typeTag, value: precision === undefined ? arg : parseFloat(arg.toFixed(precisionValue))}
            case 'boolean':
                return {type: arg ? 'T' : 'F', value: arg}
            case 'object':
                if (arg.type) {
                    return {type: this.parseType(arg.type), value: arg.value}
                } else {
                    return {type: 's', value:JSON.stringify(arg)}
                }
            case 'string':
                return {type: 's', value:arg}
            default:
                return {type: 's', value:JSON.stringify(arg)}
        }
    }

    sendOsc(data){

        if (!data) return

        if (data.host == 'midi') {

            if (midi) midi.send(data)

        } else {

            if (typeof data.address !== 'string' || data.address[0] !== '/') {
                console.error('OSC error: malformed address: "' + data.address + '')
                return
            }

            if (tcpInPort && oscTCPServer.clients[data.host] && oscTCPServer.clients[data.host][data.port]) {

                oscTCPServer.clients[data.host][data.port].send({
                    address: data.address,
                    args: data.args
                })

            } else {

                oscUDPServer.send({
                    address: data.address,
                    args: data.args
                }, data.host, data.port)
                
            }

            if (debug) console.log('OSC sent: ',{address:data.address, args: data.args}, 'To: ' + data.host + ':' + data.port)

        }


    }

    receiveOsc(data, info){

        if (!data) return

        for (i in data.args) {
            data.args[i] = data.args[i].value
        }

        if (data.args.length==1) data.args = data.args[0]

        ipc.send('receiveOsc',data)

        if (debug) console.log('OSC received: ', {address:data.address, args: data.args}, 'From: ' + data.host + ':' + data.port)

    }


    oscInFilter(data){
        if (this.customModule.oscInFilter) {
            return this.customModule.oscInFilter(data)
        } else {
            return data
        }
    }
    oscOutFilter(data){
        if (this.customModule.oscOutFilter) {
            return this.customModule.oscOutFilter(data)
        } else {
            return data
        }
    }

    oscInHandler(msg, timetag, info){
        var data = this.oscInFilter({address: msg.address, args: msg.args, host: info.address, port: info.port})
        if (!data) return
        this.receiveOsc(data)
    }

    oscInHandlerWrapper(msg, timetag, info) {
        var delay = timetag? Math.max(0,timetag.native - Date.now()) : 0
        if (delay) {
            setTimeout(()=>{
                this.oscInHandler(msg, timetag, info)
            }, delay)
        } else {
            this.oscInHandler(msg, timetag, info)
        }
    }



    init(){

        if (midi) midi.init((data)=>{

            data = this.oscInFilter({address: data.address, args: data.args, host: data.host, port: data.port})

            if (!data) return

            this.receiveOsc(data)

        })

        oscUDPServer.on('message', this.oscInHandlerWrapper.bind(this))
        oscUDPServer.open()

        if (settings.read('tcpInPort')) {
            oscTCPServer.on('message', this.oscInHandlerWrapper.bind(this))
            oscTCPServer.open()
        }

        if (this.customModule.init) {
            this.customModule.init()
        }

    }


}


var oscServer = new OscServer()
oscServer.init()

module.exports = {
    server: oscServer,
    send: function(host,port,address,args,precision) {

        var message = []

        if (!Array.isArray(args)) args = [args]
        if (typeof args=='object' && args!==null) {
            for (var i in args) {
                var arg = oscServer.parseArg(args[i],precision)
                if (arg!=null) message.push(arg)
            }
        }

        var data = oscServer.oscOutFilter({address:address, args: message, host: host, port: port})

        oscServer.sendOsc(data)

    },
    midi:midi
}
