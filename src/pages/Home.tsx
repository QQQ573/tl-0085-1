import { useState, useEffect } from 'react';
import { Coffee, AlertTriangle } from 'lucide-react';
import CupScene from '../components/CupScene';
import ControlPanel from '../components/ControlPanel';
import HeightRanking from '../components/HeightRanking';
import { useCupStore } from '../store/cupStore';

export default function Home() {
  const { getTotalHeight, currentPreset } = useCupStore();
  const [fps, setFps] = useState(60);
  const [polygonCount, setPolygonCount] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFps = () => {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(measureFps);
    };

    animationId = requestAnimationFrame(measureFps);

    const estimatedPolygons = 32 * 2 + 32 * 4 + 32 * 6 + 32 * 4 + 16 * 8 + 16 * 6;
    setPolygonCount(estimatedPolygons);

    return () => cancelAnimationFrame(animationId);
  }, []);

  const totalHeight = getTotalHeight();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-amber-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">杯型堆叠预览系统</h1>
              <p className="text-xs text-gray-500">外卖评论可视化工具 · 营销部专用</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-700">
                喜茶大杯比瑞幸矮 <span className="font-bold">10mm</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>{fps} FPS</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-gray-400">|</span>
                <span className="ml-1">Polygon: {polygonCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-140px)]">
          <div className="lg:col-span-3 order-2 lg:order-1 h-full min-h-[400px]">
            <ControlPanel />
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-4 h-full min-h-[500px]">
            <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden">
              <CupScene />
            </div>

            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">当前配置总高度</p>
                  <p className="text-3xl font-bold">
                    {totalHeight}
                    <span className="text-lg ml-1 opacity-80">mm</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-90">{currentPreset.name}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {currentPreset.layers.length} 层配料
                  </p>
                </div>
              </div>

              <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalHeight / 200) * 100)}%` }}
                />
              </div>
              <p className="text-xs opacity-75 mt-1">
                参考: 瑞幸大杯 170mm · 喜茶标准 160mm · 蜜雪超大杯 190mm
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 order-3 h-full min-h-[400px]">
            <HeightRanking />
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>📱 移动端支持双指操作</span>
            <span className="hidden sm:inline">🖱️ 拖拽旋转 · 滚轮缩放</span>
          </div>
          <div className="hidden md:block">
            <span>Three.js r160 · 目标 60FPS · Polygon ≤ 28,000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}