const checkDeviceByUserAgent = () => {
    let deviceByAgent = null
    let isIphone = false
    let isIpad = false

    if (window.navigator.userAgent.match(/iPhone/i)) {
        isIphone = true
    }

    const iPadDetect = () => {
        return [
                'iPad Simulator',
                'iPhone Simulator',
                'iPod Simulator',
                'iPad',
                'iPhone',
                'iPod'
            ].includes(window.navigator.platform)
            // iPad on iOS 13 detection
            || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    }
    isIpad = iPadDetect()

    if (window.navigator.userAgent.match(/Mobile/i)
        || window.navigator.userAgent.match(/iPhone/i)
        || window.navigator.userAgent.match(/iPod/i)
        || window.navigator.userAgent.match(/IEMobile/i)
        || window.navigator.userAgent.match(/Windows Phone/i)
        || window.navigator.userAgent.match(/Android/i)
        || window.navigator.userAgent.match(/BlackBerry/i)
        || window.navigator.userAgent.match(/webOS/i)) {
        deviceByAgent = 'phone';
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent)
    if (isTablet) {
        deviceByAgent = 'tablet'
    }

    // if (window.navigator.userAgent.match(/Tablet/i)
    //     || window.navigator.userAgent.match(/iPad/i)
    //     || window.navigator.userAgent.match(/Nexus 7/i)
    //     || window.navigator.userAgent.match(/Nexus 10/i)
    //     || window.navigator.userAgent.match(/KFAPWI/i)) {
    //     deviceByAgent = 'tablet'
    // }

    if (window.navigator.userAgent.match(/Intel Mac/i)) {
        deviceByAgent = 'desktop'
    }

    // https://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome
    let isChrome = false
    // please note,
    // that IE11 now returns undefined again for window.chrome
    // and new Opera 30 outputs true for window.chrome
    // but needs to check if window.opr is not undefined
    // and new IE Edge outputs to true now for window.chrome
    // and if not iOS Chrome check
    // so use the below updated condition
    const isChromium = window.chrome;
    const winNav = window.navigator;
    const vendorName = winNav.vendor;
    const isOpera = typeof window.opr !== "undefined";
    const isIEedge = winNav.userAgent.indexOf("Edg") > -1;
    const isIOSChrome = winNav.userAgent.match("CriOS") !== null
    const isYandexBrowser =  winNav.userAgent.search(/YaBrowser/) > 0

    if (isIOSChrome) {
        isChrome = true
    } else if (
        isChromium !== null &&
        typeof isChromium !== "undefined" &&
        vendorName === "Google Inc." &&
        isOpera === false &&
        isIEedge === false
    ) {
        isChrome = true
    }

    let isFirefoxIOS = false
    if (navigator.userAgent.match("FxiOS")) {
        isFirefoxIOS = true
    }

    let isFirefox = false
    if (navigator.userAgent.indexOf("Firefox") > 0) {
        isFirefox = true
    }

    const isWebViewIOS = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);

    const isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
        navigator.userAgent &&
        navigator.userAgent.indexOf('CriOS') == -1 &&
        navigator.userAgent.indexOf('FxiOS') == -1;

    return { deviceByAgent, isIphone, isIpad, isChrome, isIOSChrome, isFirefox, isFirefoxIOS, isWebViewIOS, isSafari, isYandexBrowser }
}

export class DeviceData {
    constructor() {
        const { deviceByAgent, isIphone, isIpad, isChrome, isIOSChrome, isFirefox, isFirefoxIOS, isWebViewIOS, isSafari, isYandexBrowser  } = checkDeviceByUserAgent()
        this.isIphone = isIphone
        this.isIpad = isIpad
        this.isChrome = isChrome
        this.isIOSChrome = isIOSChrome
        this.isFirefox = isFirefox
        this.isFirefoxIOS = isFirefoxIOS
        this.isWebViewIOS = isWebViewIOS
        this.isSafari = isSafari
        this.isYandexBrowser = isYandexBrowser

        this.isCanTouch = navigator.maxTouchPoints || 'ontouchstart' in document.documentElement
        this.isCanChangeOrientation = typeof window.orientation !== 'undefined'

        this.device = 'desktop'
        if (this.isCanTouch && this.isCanChangeOrientation) {
            this.device = 'phone'
        }
        if (deviceByAgent === 'tablet') {
            this.device = 'tablet'
        }
        this.os = null
        if (this.isSafari || this.isIphone) {
            this.os = 'iOS'
        }

        this.isMobileDevice = this.device === 'phone' || this.device === 'tablet'

        this.windowW = null
        this.windowH = null
        this.minSize = null
        this.touchSense = null

        window.addEventListener('resize', this.resize.bind(this))
        this.resize()
    }

    resize () {
        this.windowW = window.innerWidth
        this.windowH = window.innerHeight
        this.minSize = Math.min(this.windowW, this.windowH)
        // used for speed rotate camera by phones touches 
        this.touchSense = this.minSize / 3.2
    }
}
