declare module "@juspay-tech/react-hyper-js" {
    export const UnifiedCheckout: any;
    export const HyperElements: any;
}

declare module "@juspay-tech/hyper-js" {
    export const loadHyper: (publishableKey: string) => Promise<any>;
}
