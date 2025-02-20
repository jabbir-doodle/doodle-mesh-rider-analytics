// utils/networkHelpers.ts
export const macToIpAddress = (macAddress: string): string => {
    const lastFourHex = macAddress.split(':').slice(-2).join('');
    const decimal1 = parseInt(lastFourHex.slice(0, 2), 16);
    const decimal2 = parseInt(lastFourHex.slice(2, 4), 16);
    return `10.223.${decimal1}.${decimal2}`;
};

export const formatMacAddress = (mac: string): string => {
    return mac.toUpperCase();
};