// Dirty browser window shim

document = {
    createElementNS: x=>[],
    addEventListener: ()=>{},
    createRange: ()=>{
        return {
            createContextualFragment:()=>{return {
                firstChild: {
                    querySelectorAll: x=>[]
                }
            }},
            selectNode: ()=>{}
        }
    }
}

window = {
    addEventListener: ()=>{},
    location: {},
    document: document,
    navigator: {},
    NodeList: Array,
    WebSocket: Object
}

Object.assign(global, window)

// Required globals

DOM = require('../src/browser/js/app/dom')
DOM.init()
CANVAS_FRAMERATE = 1
LANG = 'en'

// Here we go

var widgets = require('../src/browser/js/app/widgets'),
    doc = '',
    first

for (var k in widgets.categories) {
    var category = widgets.categories[k]

    doc += '\n\n'
    doc += '## ' + k

    for (var kk in category) {
        var type = category[kk],
            defaults = widgets.widgets[type].defaults()

        doc += '\n\n'
        doc += '### ' + type
        doc += '\n\n'

        doc += '| property | type |default | description |'
        doc += '\n'
        doc += '| --- | --- | --- | --- |'

        for (var propName in defaults) {

            var prop = defaults[propName]

            if (propName === '_props' || propName === 'type' || propName[0] === '_') continue

            var help = Array.isArray(prop.help) ? prop.help.join('<br/>') : prop.help || ''

            doc += '\n'
            doc += `| ${propName} | \`${prop.type.replace(/\|/g,'\`\\|<br/>\`')}\` |\`${JSON.stringify(prop.value)}\` | ${help} |`

        }

    }
}

console.log(doc)
