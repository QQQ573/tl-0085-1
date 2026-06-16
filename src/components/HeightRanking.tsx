import { Trophy, TrendingUp } from 'lucide-react';
import { useCupStore, BRAND_HEIGHTS, CUP_PRESETS } from '../store/cupStore';
import { cn } from '../lib/utils';

export default function HeightRanking() {
  const { currentPreset, getTotalHeight, setPreset } = useCupStore();
  const currentTotalHeight = getTotalHeight();

  const allBrands = [
    ...BRAND_HEIGHTS,
    {
      brand: `当前配置 (${currentPreset.name})`,
      height: currentTotalHeight,
      color: '#f59e0b',
      isCurrent: true,
    },
  ].sort((a, b) => b.height - a.height);

  const maxHeight = Math.max(...allBrands.map((b) => b.height));

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Trophy className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Trophy className="w-4 h-4 text-amber-600" />;
    return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-gray-400">{index + 1}</span>;
  };

  const handleBrandClick = (brand: string) => {
    const preset = CUP_PRESETS.find((p) => brand.includes(p.name) || brand.includes(p.brand));
    if (preset) {
      setPreset(preset);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white rounded-xl shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          杯高排名
        </h3>
        <span className="text-xs text-gray-400">单位: mm</span>
      </div>

      <div className="space-y-3">
        {allBrands.map((brandData, index) => {
          const percentage = (brandData.height / maxHeight) * 100;
          const isCurrent = (brandData as { isCurrent?: boolean }).isCurrent;

          return (
            <div
              key={brandData.brand}
              className={cn(
                'relative p-3 rounded-lg transition-all duration-300 cursor-pointer',
                'hover:scale-[1.02] active:scale-[0.98]',
                isCurrent
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-md'
                  : 'bg-gray-50 border border-gray-100 hover:border-gray-200'
              )}
              onClick={() => !isCurrent && handleBrandClick(brandData.brand)}
            >
              <div className="flex items-center gap-2 mb-2">
                {getRankIcon(index)}
                <span
                  className={cn(
                    'text-sm font-medium flex-1 truncate',
                    isCurrent ? 'text-amber-700' : 'text-gray-700'
                  )}
                >
                  {brandData.brand}
                </span>
                <span
                  className={cn(
                    'text-sm font-bold',
                    isCurrent ? 'text-amber-600' : 'text-gray-600'
                  )}
                >
                  {brandData.height}
                </span>
              </div>

              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2',
                    isCurrent && 'animate-pulse'
                  )}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: brandData.color,
                    minWidth: '40px',
                  }}
                >
                  {percentage > 20 && (
                    <span className="text-xs font-bold text-white drop-shadow">
                      {brandData.height}mm
                    </span>
                  )}
                </div>

                <div
                  className="absolute top-0 left-0 h-full pointer-events-none"
                  style={{ width: `${percentage}%` }}
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 bg-white/30"
                    style={{ animation: 'shimmer 2s infinite' }}
                  />
                </div>
              </div>

              {index < allBrands.length - 1 && (
                <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-10">
                  <div className="bg-white rounded-full px-2 py-0.5 text-xs font-bold text-red-500 shadow-md border border-red-200">
                    +{allBrands[index].height - allBrands[index + 1].height}
                  </div>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-md">
                  当前
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <h4 className="text-sm font-bold text-green-700 mb-2">📊 数据分析</h4>
        <div className="space-y-1 text-xs text-green-600">
          <p>• 最高: {allBrands[0].brand} ({allBrands[0].height}mm)</p>
          <p>• 最矮: {allBrands[allBrands.length - 1].brand} ({allBrands[allBrands.length - 1].height}mm)</p>
          <p>• 差距: {allBrands[0].height - allBrands[allBrands.length - 1].height}mm</p>
          <p>
            • 喜茶 vs 瑞幸: {BRAND_HEIGHTS.find((b) => b.brand.includes('喜茶'))?.height || 0}mm vs{' '}
            {BRAND_HEIGHTS.find((b) => b.brand.includes('瑞幸'))?.height || 0}mm
            <span className="text-amber-600 font-bold ml-1">
              (差 {(BRAND_HEIGHTS.find((b) => b.brand.includes('瑞幸'))?.height || 0) - (BRAND_HEIGHTS.find((b) => b.brand.includes('喜茶'))?.height || 0)}mm)
            </span>
          </p>
        </div>
      </div>

      <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-100">
        <p>💡 点击品牌可快速切换预设</p>
        <p>⚠️ 数据仅供参考，以实物为准</p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
