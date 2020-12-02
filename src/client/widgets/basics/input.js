var Canvas = require('../common/canvas'),
    {deepCopy} = require('../../utils'),
    html = require('nanohtml')

class Input extends Canvas {

    static description() {

        return 'Text input.'

    }

    static defaults() {

        return super.defaults().extend({
            style: {
                _separator_input_style: 'Input style',
                align: {type: 'string', value: 'center', choices: ['center', 'left', 'right'], help: 'Set to `left` or `right` to change text alignment (otherwise center)'},
                unit: {type: 'string', value: '', help: 'Unit will be appended to the displayed widget\'s value (it doesn\'t affect osc messages)'},
            },
            class_specific: {
                asYouType: {type: 'boolean', value: false, help: 'Set to `true` to make the input send its value at each keystroke'},
                validation: {type: 'string', value: '', help: [
                    'Regular expression: if the submitted value doesn\'t match the regular expression, it will be reset to the last valid value.',
                    'If leading and trailing slashes are omitted, they will be added automatically and the flag will be set to "gm"',
                    'Examples:',
                    '- `^[0-9]*$` accepts digits only, any number of them',
                    '- `/^[a-z\s]{0,10}$/i` accept between 0 and 10 alphabetic characters and spaces (case insensitive)',
                ]}
            }
        })

    }

    constructor(options) {

        super({...options, html: html`
            <inner>
                <canvas></canvas>
            </inner>
        `})

        this.value = ''
        this.stringValue = ''
        this.focused = false
        this.tabKeyBlur = false
        this.validation = null

        if (this.getProp('vertical')) this.widget.classList.add('vertical')
        if (this.getProp('align') === 'left') this.widget.classList.add('left')
        if (this.getProp('align') === 'right') this.widget.classList.add('right')


        if (this.getProp('interaction')) {

            this.widget.setAttribute('tabindex', 0)
            this.widget.addEventListener('focus', this.focus.bind(this))
            this.input = html`<input class="no-keybinding"></input>`
            this.input.addEventListener('blur', (e)=>{
                this.blur(this.tabKeyBlur)
                this.tabKeyBlur = false
            })
            var asYouType = this.getProp('asYouType')

            if (this.getProp('validation') !== '') {
                var validation = String(this.getProp('validation')),
                    flags = validation.match(/^\/.*\/.*$/) ? validation.split('/').pop() : 'gm',
                    regExpString = validation.match(/^\/.*\/.*$/) ? validation.replace(/^\/(.*)\/.*$/, '$1') : validation

                if (!regExpString.match(/^\^.*\$$/)) regExpString = '^' + regExpString + '$'

                this.validation = new RegExp(regExpString, flags)
            }

            this.input.addEventListener('keydown', (e)=>{
                if (e.keyCode === 13) this.blur() // enter
                else if (e.keyCode === 27) this.blur(false) // esc
                else if (e.keyCode === 9) this.tabKeyBlur = true // tab
                else if (asYouType) {
                    setTimeout(()=>{
                        this.inputChange()
                    })
                }
            })

        }

    }

    focus() {

        if (this.focused) return
        this.focused = true

        this.widget.setAttribute('tabindex','-1')
        this.input.value = this.stringValue
        this.widget.insertBefore(this.input, this.canvas)
        this.input.focus()
        this.input.setSelectionRange(0, this.input.value.length)

    }

    blur(change=true) {

        if (!this.focused) return
        this.focused = false

        if (change) this.inputChange()

        this.widget.setAttribute('tabindex','0')
        this.widget.removeChild(this.input)

    }

    inputChange() {

        this.setValue(this.input.value, {sync:true, send:true})

    }

    resizeHandle(event){

        super.resizeHandle(event)

        // if (this.getProp('vertical')){
        //
        //     var ratio = CANVAS_SCALING * this.scaling
        //
        //     this.ctx.setTransform(1, 0, 0, 1, 0, 0)
        //     this.ctx.rotate(-Math.PI/2)
        //     this.ctx.translate(-this.height * ratio, 0)
        //
        //
        //     if (ratio != 1) this.ctx.scale(ratio, ratio)
        // }


    }

    setValue(v, options={} ) {

        if (this.validation && !this.getStringValue(v).match(this.validation)) {
            this.input.value = this.value
            return
        }

        try {
            this.value = JSON.parse(v)
        } catch (err) {
            this.value = v
        }

        if (this.value === '' || this.value === null) this.value = this.getProp('default')

        this.stringValue = this.getStringValue(this.value)
        this.batchDraw()

        if (options.send && !options.fromSync) this.sendValue()
        if (options.sync) this.changed(options)

    }

    draw() {

        var v = this.stringValue,
            width = this.width,
            height = this.height

        if (this.getProp('unit') && v.length) v += ' ' + this.getProp('unit')

        this.clear()

        this.ctx.fillStyle = this.cssVars.colorText

        if (this.textAlign == 'center') {
            this.ctx.fillText(v, Math.round(width/2), Math.round(height/2))
        } else if (this.textAlign == 'right') {
            this.ctx.fillText(v, width, Math.round(height/2))
        } else {
            this.ctx.fillText(v, 0, Math.round(height/2))
        }

        this.clearRect = [0, 0, width, height]

    }

    getStringValue(v) {
        if (v === undefined) return ''
        return typeof v != 'string' ?
            JSON.stringify(deepCopy(v, this.decimals)).replace(/,/g, ', ') :
            v
    }

}

Input.dynamicProps = Input.prototype.constructor.dynamicProps
    .filter(x=>x !== 'interaction')


module.exports = Input
