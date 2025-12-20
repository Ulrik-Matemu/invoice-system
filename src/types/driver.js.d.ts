declare module 'driver.js' {
    export interface DriverOptions {
        showProgress?: boolean;
        steps?: DriveStep[];
        onDestroyStarted?: () => void;
    }

    export interface DriveStep {
        element: string;
        popover: {
            title: string;
            description: string;
            side?: string;
            align?: string;
        };
    }

    export interface Driver {
        drive: (stepIndex?: number) => void;
        destroy: () => void;
    }

    export function driver(options?: DriverOptions): Driver;
}
