import { create } from 'zustand';

export interface CupLayer {
  id: string;
  name: string;
  height: number;
  color: string;
  visible: boolean;
  type: 'ice' | 'tea' | 'topping' | 'milk' | 'foam';
}

export interface CupPreset {
  id: string;
  name: string;
  brand: string;
  cupHeight: number;
  cupTopRadius: number;
  cupBottomRadius: number;
  layers: Omit<CupLayer, 'visible'>[];
}

export type BaseType = 'bag' | 'holder';

export interface CupState {
  currentPreset: CupPreset;
  cupType: 'standard' | 'large' | 'venti';
  baseType: BaseType;
  customLayers: CupLayer[];
  addIce: boolean;
  addTopping: boolean;
  addMilk: boolean;
  addFoam: boolean;
  crossSectionMode: boolean;
  crossSectionLayer: string | null;
  selectedLayerId: string | null;
  rotation: { x: number; y: number };
  zoom: number;
}

export const BRAND_HEIGHTS: { brand: string; height: number; color: string }[] = [
  { brand: '星巴克 Venti', height: 185, color: '#00704A' },
  { brand: '瑞幸大杯', height: 170, color: '#0D345C' },
  { brand: '喜茶标准', height: 160, color: '#222222' },
  { brand: '奈雪霸气', height: 175, color: '#FF6B9D' },
  { brand: 'CoCo 大杯', height: 168, color: '#FF6B00' },
  { brand: '蜜雪冰城超大杯', height: 190, color: '#E60012' },
];

export const CUP_PRESETS: CupPreset[] = [
  {
    id: 'starbucks-venti',
    name: '星巴克 Venti',
    brand: '星巴克',
    cupHeight: 185,
    cupTopRadius: 45,
    cupBottomRadius: 30,
    layers: [
      { id: 's1', name: '浓缩咖啡', height: 35, color: '#3D2314', type: 'tea' },
      { id: 's2', name: '牛奶', height: 55, color: '#FFF8DC', type: 'milk' },
      { id: 's-ice', name: '冰块', height: 30, color: '#E8F4FF', type: 'ice' },
      { id: 's3', name: '奶泡', height: 25, color: '#FAEBD7', type: 'foam' },
    ],
  },
  {
    id: 'luckin-large',
    name: '瑞幸大杯',
    brand: '瑞幸',
    cupHeight: 170,
    cupTopRadius: 42,
    cupBottomRadius: 28,
    layers: [
      { id: 'l1', name: '瑞纳冰基底', height: 45, color: '#8B4513', type: 'tea' },
      { id: 'l-milk', name: '牛奶', height: 25, color: '#FFF8DC', type: 'milk' },
      { id: 'l-ice', name: '冰块', height: 30, color: '#E8F4FF', type: 'ice' },
      { id: 'l2', name: '奶油顶', height: 25, color: '#FFFAF0', type: 'foam' },
    ],
  },
  {
    id: 'heytea-standard',
    name: '喜茶标准',
    brand: '喜茶',
    cupHeight: 160,
    cupTopRadius: 44,
    cupBottomRadius: 29,
    layers: [
      { id: 'h1', name: '茶汤', height: 50, color: '#DAA520', type: 'tea' },
      { id: 'h-milk', name: '牛奶', height: 25, color: '#FFF8DC', type: 'milk' },
      { id: 'h-ice', name: '冰块', height: 30, color: '#E8F4FF', type: 'ice' },
      { id: 'h2', name: '芝士奶盖', height: 28, color: '#FFFACD', type: 'foam' },
    ],
  },
  {
    id: 'nayuki-baqi',
    name: '奈雪霸气',
    brand: '奈雪',
    cupHeight: 175,
    cupTopRadius: 46,
    cupBottomRadius: 30,
    layers: [
      { id: 'n2', name: '果肉', height: 25, color: '#FFB6C1', type: 'topping' },
      { id: 'n1', name: '水果茶', height: 70, color: '#FF6347', type: 'tea' },
      { id: 'n-ice', name: '冰块', height: 30, color: '#E8F4FF', type: 'ice' },
    ],
  },
  {
    id: 'coco-large',
    name: 'CoCo 大杯',
    brand: 'CoCo',
    cupHeight: 168,
    cupTopRadius: 43,
    cupBottomRadius: 28,
    layers: [
      { id: 'c-pearl', name: '珍珠', height: 25, color: '#2F1810', type: 'topping' },
      { id: 'c1', name: '奶茶', height: 60, color: '#DEB887', type: 'tea' },
      { id: 'c-ice', name: '冰块', height: 30, color: '#E8F4FF', type: 'ice' },
      { id: 'c2', name: '奶盖', height: 18, color: '#FFFACD', type: 'foam' },
    ],
  },
  {
    id: 'mixue-super',
    name: '蜜雪冰城超大杯',
    brand: '蜜雪冰城',
    cupHeight: 190,
    cupTopRadius: 48,
    cupBottomRadius: 32,
    layers: [
      { id: 'm2', name: '柠檬片', height: 20, color: '#FFD700', type: 'topping' },
      { id: 'm1', name: '柠檬水', height: 75, color: '#FFFACD', type: 'tea' },
      { id: 'm-ice', name: '冰块', height: 45, color: '#E8F4FF', type: 'ice' },
    ],
  },
];

interface CupActions {
  setPreset: (preset: CupPreset) => void;
  setCupType: (type: 'standard' | 'large' | 'venti') => void;
  setBaseType: (type: BaseType) => void;
  toggleIce: () => void;
  toggleTopping: () => void;
  toggleMilk: () => void;
  toggleFoam: () => void;
  toggleLayerVisibility: (layerId: string) => void;
  setCrossSectionMode: (enabled: boolean) => void;
  setCrossSectionLayer: (layerId: string | null) => void;
  setSelectedLayerId: (layerId: string | null) => void;
  setRotation: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  getTotalHeight: () => number;
  getVisibleLayers: () => CupLayer[];
}

export const useCupStore = create<CupState & CupActions>((set, get) => ({
  currentPreset: CUP_PRESETS[0],
  cupType: 'venti',
  baseType: 'holder',
  customLayers: [],
  addIce: true,
  addTopping: true,
  addMilk: true,
  addFoam: true,
  crossSectionMode: false,
  crossSectionLayer: null,
  selectedLayerId: null,
  rotation: { x: -0.4, y: 0.5 },
  zoom: 1,

  setPreset: (preset) => set({ currentPreset: preset }),
  setCupType: (type) => set({ cupType: type }),
  setBaseType: (type) => set({ baseType: type }),
  toggleIce: () => set((state) => ({ addIce: !state.addIce })),
  toggleTopping: () => set((state) => ({ addTopping: !state.addTopping })),
  toggleMilk: () => set((state) => ({ addMilk: !state.addMilk })),
  toggleFoam: () => set((state) => ({ addFoam: !state.addFoam })),
  toggleLayerVisibility: (layerId) =>
    set((state) => {
      const preset = state.currentPreset;
      const newLayers = preset.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !((l as CupLayer).visible ?? true) } : l
      ) as CupLayer[];
      return {
        currentPreset: { ...preset, layers: newLayers },
      };
    }),
  setCrossSectionMode: (enabled) => set({ crossSectionMode: enabled }),
  setCrossSectionLayer: (layerId) => set({ crossSectionLayer: layerId }),
  setSelectedLayerId: (layerId) => set({ selectedLayerId: layerId }),
  setRotation: (x, y) => set({ rotation: { x, y } }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),

  getTotalHeight: () => {
    const state = get();
    const visibleLayers = state.getVisibleLayers();
    return visibleLayers.reduce((sum, layer) => sum + layer.height, 0);
  },

  getVisibleLayers: () => {
    const state = get();
    const preset = state.currentPreset;
    let layers = preset.layers.map((l) => ({ ...l, visible: (l as CupLayer).visible ?? true })) as CupLayer[];

    if (!state.addIce) {
      layers = layers.filter((l) => l.type !== 'ice');
    }
    if (!state.addTopping) {
      layers = layers.filter((l) => l.type !== 'topping');
    }
    if (!state.addMilk) {
      layers = layers.filter((l) => l.type !== 'milk');
    }
    if (!state.addFoam) {
      layers = layers.filter((l) => l.type !== 'foam');
    }

    return layers.filter((l) => l.visible);
  },
}));
