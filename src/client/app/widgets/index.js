module.exports.widgets = {
    // tabs
    tab: require('./containers/tab'),
    root: require('./containers/root'),

    // sliders
    fader: require('./sliders/fader'),
    knob: require('./sliders/knob'),
    encoder: require('./sliders/encoder'),
    range: require('./sliders/range'),

    // buttons
    toggle: require('./buttons/toggle'),
    push: require('./buttons/push'),
    switch: require('./buttons/switch'),
    dropdown: require('./buttons/dropdown'),
    menu: require('./buttons/menu'),

    // pads
    xy: require('./pads/xy'),
    rgb: require('./pads/rgb'),
    multixy: require('./pads/multixy'),

    // matrices
    matrix: require('./matrices/matrix'),
    keyboard: require('./matrices/keyboard'),
    patchbay: require('./matrices/patchbay').PatchBay,
    patchbaynode: require('./matrices/patchbay').PatchBayNode,

    // plots
    led: require('./plots/led'),
    rgbled: require('./plots/rgbled'),
    plot: require('./plots/plot'),
    eq: require('./plots/eq'),
    visualizer: require('./plots/visualizer'),
    meter: require('./plots/meter'),
    text: require('./plots/text'),
    image: require('./plots/image'),
    svg: require('./plots/svg'),
    html: require('./plots/html'),
    frame: require('./plots/frame'),

    // containers
    strip: require('./containers/strip'),
    panel: require('./containers/panel'),
    modal: require('./containers/modal'),
    clone: require('./containers/clone'),

    // state switchers
    switcher: require('./switchers/switcher'),
    crossfader: require('./switchers/crossfader'),
    state: require('./switchers/state'),

    // inputs
    input: require('./inputs/input'),
    keys: require('./inputs/keys'),
    script: require('./inputs/script'),
    gyroscope: require('./inputs/gyroscope'),
    file: require('./inputs/file'),

}

module.exports.categories = {
    'Sliders':['fader','knob', 'encoder', 'range'],
    'Buttons':['toggle','push','switch', 'dropdown', 'menu'],
    'Pads':['xy','rgb','multixy'],
    'Matrices':['matrix', 'keyboard', 'patchbay'],
    'Plots':['plot','eq','visualizer','led', 'rgbled','meter','text', 'image', 'svg', 'html', 'frame'],
    'Containers':['panel','strip','modal', 'clone'],
    'Switchers':['state', 'switcher','crossfader'],
    'Inputs':['input', 'keys', 'script', 'gyroscope', 'file']
}
