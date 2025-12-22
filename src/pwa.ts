import { registerSW } from 'virtual:pwa-register'

window.addEventListener('load', () => {
    registerSW({
        immediate: true,
        onNeedRefresh() {
            console.log('onNeedRefresh')
        },
        onOfflineReady() {
            console.log('onOfflineReady')
        },
    })
})
