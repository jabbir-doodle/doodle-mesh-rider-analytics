export interface RadioModel {
    name?: string;
    power: number[];
    sensitivity: number[];
    modulation: string[];
    codingRate: number[];
    bitsPerSymbol: number[];
    image?: string;
  }
  
  export interface RadioModels {
    [key: string]: RadioModel;
  }
  
  export interface DeviceDetail {
    name: string;
    image: string;
  }
  
  export interface DeviceDetails {
    [key: string]: DeviceDetail;
  }
  
  export interface RangeCalculationResult {
    mcs: number;
    range: number;
    throughput: number;
    fresnelClearance: number;
    withinThroughput: boolean;
    withinClearance: boolean;
  }
  
  export interface AnalysisResults {
    radioVariant: string;
    mcsMode: string;
    totalThroughput: number;
    finalRange: number;
    finalMcsRate: number;
    maxRange: number;
    maxMcsRate: number;
    maxThroughput: number;
    throughputDelta: string;
    rangeDelta: string;
    finalAGL: number;
    aglM: number;
    aglDelta: string;
    aglDeltaPositive: boolean;
    aglIncreaseNeeded: string;
    rangeResults: RangeCalculationResult[];
  }
  
  export interface ChartDataPoint {
    distance: number;
    throughput: number;
    fresnelClearance: number;
    mcs: number;
    estimatedRange?: boolean;
  }
  
  export interface SelectOption {
    value: string | number;
    label: string;
  }
  
  export interface InputFieldProps {
    label: string;
    id: string;
    value: string | number | boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    type?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;  // Add this line
    options?: SelectOption[];
    disabled?: boolean;
    className?: string;
    checked?: boolean;  // Add this explicitly for checkbox inputs
  }
  
  export interface DeviceCardProps {
    deviceKey: string;
    device: DeviceDetail;
    isSelected: boolean;
    onClick: () => void;
  }
  
  export interface McsRangeItemProps {
    result: RangeCalculationResult;
  }
  
  export interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
  }
  
  export interface AccordionState {
    [key: string]: boolean;
  }
  
  export const Constants = {
    ipv4: 20,
    eth2: 14,
    batAdv: 10,
    llc: 8,
    ieee80211: 42,
    phy: 4,
    aifs: 8,
    cwSize: 15,
    txop: 100000,
    mpduDelimiter: 0,
    ltf: 4,
    phyHeader11n: 40,
    sifs: 10,
    baSize: 32,
    psr: 90
  };
  
  export const DeviceColors: Record<string, string> = {
    "1L": "emerald",
    "2L": "violet",
    "2KO": "amber",
    "2KW": "rose"
  };
  
  export const getDeviceColor = (device: string): string => {
    return DeviceColors[device] || "sky";
  };