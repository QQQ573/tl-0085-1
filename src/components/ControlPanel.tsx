import { Coffee, IceCream, Droplets, Cloud, Eye, EyeOff, Slice, Package, Coffee as CoffeeIcon } from 'lucide-react';
import { useCupStore, CUP_PRESETS, CupLayer } from '../store/cupStore';
import { cn } from '../lib/utils';

export default function ControlPanel() {
  const {
    currentPreset,
    setPreset,
    baseType,
    setBaseType,
    addIce,
    toggleIce,
    addTopping,
    toggleTopping,
    addMilk,
    toggleMilk,
    addFoam,
    toggleFoam,
    crossSectionMode,
    setCrossSectionMode,
    crossSectionLayer,
    setCrossSectionLayer,
    getVisibleLayers,
    toggleLayerVisibility,
    getTotalHeight,
  } = useCupStore();

  const allLayers = currentPreset.layers as (CupLayer & { visible?: boolean })[];
  const totalHeight = getTotalHeight();

  return (
    <div className="h-full overflow-y-auto bg-white rounded-xl shadow-lg p-4 space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Coffee className="w-5 h-5 text-amber-600" />
          品牌预设
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {CUP_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPreset(preset)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                'border-2 hover:scale-105',
                currentPreset.id === preset.id
                  ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-amber-300'
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          底座类型
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setBaseType('holder')}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 border-2',
              baseType === 'holder'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300'
            )}
          >
            <CoffeeIcon className="w-4 h-4 inline mr-1" />
            堂食杯托
          </button>
          <button
            onClick={() => setBaseType('bag')}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 border-2',
              baseType === 'bag'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300'
            )}
          >
            <Package className="w-4 h-4 inline mr-1" />
            外卖袋装
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-cyan-600" />
          配料选项
        </h3>
        <div className="space-y-2">
          <ToggleButton
            checked={addIce}
            onChange={toggleIce}
            icon={<IceCream className="w-4 h-4" />}
            label="加冰"
            activeColor="bg-cyan-500"
          />
          <ToggleButton
            checked={addTopping}
            onChange={toggleTopping}
            icon={<Coffee className="w-4 h-4" />}
            label="加料（珍珠/果肉等）"
            activeColor="bg-amber-600"
          />
          <ToggleButton
            checked={addMilk}
            onChange={toggleMilk}
            icon={<Droplets className="w-4 h-4" />}
            label="加牛奶"
            activeColor="bg-yellow-400"
          />
          <ToggleButton
            checked={addFoam}
            onChange={toggleFoam}
            icon={<Cloud className="w-4 h-4" />}
            label="加奶泡/奶盖"
            activeColor="bg-orange-300"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Slice className="w-5 h-5 text-purple-600" />
          层查看
        </h3>
        <ToggleButton
          checked={crossSectionMode}
          onChange={() => {
            setCrossSectionMode(!crossSectionMode);
            if (crossSectionMode) {
              setCrossSectionLayer(null);
            }
          }}
          icon={<Slice className="w-4 h-4" />}
          label="横截面模式"
          activeColor="bg-purple-500"
        />

        {crossSectionMode && (
          <div className="space-y-2 mt-3">
            <p className="text-sm text-gray-500">选择要查看横截面的层：</p>
            {getVisibleLayers().map((layer) => (
              <button
                key={layer.id}
                onClick={() => setCrossSectionLayer(crossSectionLayer === layer.id ? null : layer.id)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-left text-sm transition-all',
                  'flex items-center justify-between',
                  crossSectionLayer === layer.id
                    ? 'bg-purple-100 border-2 border-purple-400 text-purple-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                  {layer.name}
                </span>
                <span className="text-xs text-gray-400">{layer.height}mm</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800">图层列表</h3>
        <div className="space-y-2">
          {allLayers.map((layer) => {
            const isVisible = layer.visible !== false;
            return (
              <div
                key={layer.id}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg transition-all',
                  isVisible ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className={cn('text-sm', !isVisible && 'line-through text-gray-400')}>
                    {layer.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{layer.height}mm</span>
                  <button
                    onClick={() => toggleLayerVisibility(layer.id)}
                    className="p-1 rounded hover:bg-gray-200 transition-colors"
                    title={isVisible ? '隐藏' : '显示'}
                  >
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-gray-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <div className="text-center">
          <p className="text-sm text-amber-600 font-medium">总高度</p>
          <p className="text-3xl font-bold text-amber-700 mt-1">
            {totalHeight}
            <span className="text-lg ml-1">mm</span>
          </p>
          <p className="text-xs text-amber-500 mt-1">
            {currentPreset.name} · {baseType === 'holder' ? '堂食' : '外卖'}
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <p>💡 操作提示：</p>
        <p>• 鼠标拖拽旋转视角</p>
        <p>• 滚轮缩放视图</p>
        <p>• 移动端双指捏合缩放</p>
      </div>
    </div>
  );
}

interface ToggleButtonProps {
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
}

function ToggleButton({ checked, onChange, icon, label, activeColor }: ToggleButtonProps) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200',
        'border-2',
        checked
          ? `${activeColor} border-transparent text-white shadow-md`
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
      )}
    >
      <span className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{label}</span>
      </span>
      <div
        className={cn(
          'w-10 h-6 rounded-full relative transition-colors duration-200',
          checked ? 'bg-white/30' : 'bg-gray-300'
        )}
      >
        <div
          className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-1'
          )}
        />
      </div>
    </button>
  );
}
