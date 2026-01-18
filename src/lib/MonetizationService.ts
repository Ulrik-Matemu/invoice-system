declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

class MonetizationService {
    private static instance: MonetizationService;
    private initialized: boolean = false;

    private constructor() { }

    public static getInstance(): MonetizationService {
        if (!MonetizationService.instance) {
            MonetizationService.instance = new MonetizationService();
        }
        return MonetizationService.instance;
    }

    public init(clientId: string) {
        if (this.initialized) return;

        const script = document.createElement('script');
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);

        this.initialized = true;
    }

    public pushAd(params: any = {}) {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push(params);
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }
}

export const monetizationService = MonetizationService.getInstance();
