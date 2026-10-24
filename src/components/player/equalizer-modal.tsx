import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { usePlayer, EQUALIZER_PRESETS, type EqualizerPresetName } from "@/lib/player-store";
import { Sliders, Sparkles, Volume2, X, RotateCcw, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const BANDS = [
  { label: "60 Hz", role: "Sub-Bass", index: 0, xPercent: 12 },
  { label: "250 Hz", role: "Bass", index: 1, xPercent: 31 },
  { label: "1 kHz", role: "Mids", index: 2, xPercent: 50 },
  { label: "4 kHz", role: "Presence", index: 3, xPercent: 69 },
  { label: "12 kHz", role: "Treble", index: 4, xPercent: 88 },
];

const PRESET_ICONS: Record<EqualizerPresetName, string> = {
  "Flat": "⚖️",
  "Bass Boost": "🔊",
  "Vocal": "🎙️",
  "Rock": "🎸",
  "EDM": "⚡",
  "Acoustic": "🎻",
  "Treble Boost": "✨",
  "Late Night": "🌙",
};

export function EqualizerModal() {
  const open = usePlayer((s) => s.equalizerOpen);
  const setOpen = usePlayer((s) => s.setEqualizerOpen);

  const enabled = usePlayer((s) => s.equalizerEnabled);
  const setEnabled = usePlayer((s) => s.setEqualizerEnabled);

  const bands = usePlayer((s) => s.equalizerBands);
  const setBand = usePlayer((s) => s.setEqualizerBand);

  const bassBoost = usePlayer((s) => s.bassBoost);
  const setBassBoost = usePlayer((s) => s.setBassBoost);

  const currentPreset = usePlayer((s) => s.equalizerPreset);
  const applyPreset = usePlayer((s) => s.applyEqualizerPreset);

  const volumeNorm = usePlayer((s) => s.volumeNormalization);
  const toggleVolumeNorm = usePlayer((s) => s.toggleVolumeNormalization);

  const presetList = Object.keys(EQUALIZER_PRESETS) as EqualizerPresetName[];

  // Compute smooth cubic Bezier curve for SVG frequency visualizer
  // Coordinate space: 400 width x 100 height. Center line (0 dB) is y=50.
  const svgWidth = 400;
  const svgHeight = 100;
  const centerY = 50;

  const points = BANDS.map((b) => {
    const gain = enabled ? (bands[b.index] ?? 0) : 0;
    // Low frequencies also receive slight boost from bassBoost
    const extraBass = b.index === 0 && enabled ? bassBoost * 0.75 : b.index === 1 && enabled ? bassBoost * 0.35 : 0;
    const effectiveGain = Math.max(-12, Math.min(14, gain + extraBass));
    const x = (b.xPercent / 100) * svgWidth;
    const y = centerY - (effectiveGain / 12) * 38;
    return { x, y, gain: effectiveGain };
  });

  // Construct smooth SVG path through the 5 points
  const p0 = { x: 0, y: points[0].y };
  const pEnd = { x: svgWidth, y: points[4].y };
  const allPts = [p0, ...points, pEnd];

  let pathD = `M ${allPts[0].x} ${allPts[0].y}`;
  for (let i = 0; i < allPts.length - 1; i++) {
    const curr = allPts[i];
    const nxt = allPts[i + 1];
    const cpx1 = curr.x + (nxt.x - curr.x) / 2;
    const cpy1 = curr.y;
    const cpx2 = curr.x + (nxt.x - curr.x) / 2;
    const cpy2 = nxt.y;
    pathD += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${nxt.x} ${nxt.y}`;
  }

  const fillD = `${pathD} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto bg-zinc-950/95 border-white/10 text-white backdrop-blur-2xl [scrollbar-width:thin]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-accent/20 border border-accent/30 grid place-items-center text-accent">
              <Sliders className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Studio Equalizer
                {enabled && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent px-2 py-0.5 rounded-full border border-accent/30 shadow-[0_0_8px_rgba(255,74,58,0.4)]">
                    Active
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-white/50 text-xs mt-0.5">
                5-Band Graphic DSP, Bass Boost & Loudness Engine
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pr-2">
              <span className="text-xs text-white/70 font-medium">EQ On</span>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                aria-label="Toggle Equalizer"
              />
            </div>
            <DialogClose className="grid size-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors">
              <X className="size-4" />
            </DialogClose>
          </div>
        </div>

        {/* Live SVG Frequency Response Curve */}
        <div className="relative w-full h-[100px] mt-2 rounded-2xl bg-black/40 border border-white/10 overflow-hidden select-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />

          {/* Reference dB grids */}
          <div className="absolute inset-x-0 top-[12px] border-b border-white/[0.06] flex justify-between px-3 text-[9px] font-mono text-white/30">
            <span>+12 dB</span>
            <span className="text-white/20">HIGH SHELF</span>
          </div>
          <div className="absolute inset-x-0 top-[50px] border-b border-white/[0.1] border-dashed flex justify-between px-3 text-[9px] font-mono text-white/40">
            <span>0 dB</span>
            <span className="text-white/25">FLAT LINE</span>
          </div>
          <div className="absolute inset-x-0 bottom-[12px] border-t border-white/[0.06] flex justify-between px-3 text-[9px] font-mono text-white/30">
            <span>-12 dB</span>
            <span className="text-white/20">LOW CUT</span>
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full preserve-3d" preserveAspectRatio="none">
            <defs>
              <linearGradient id="eq-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4a3a" stopOpacity={enabled ? "0.35" : "0.08"} />
                <stop offset="100%" stopColor="#ff4a3a" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient fill under curve */}
            <path d={fillD} fill="url(#eq-gradient)" className="transition-all duration-200" />

            {/* Stroke line */}
            <path
              d={pathD}
              fill="none"
              stroke={enabled ? "#ff4a3a" : "rgba(255,255,255,0.25)"}
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-200 drop-shadow-[0_0_8px_rgba(255,74,58,0.6)]"
            />

            {/* Band frequency dots */}
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill={enabled ? "#ffffff" : "rgba(255,255,255,0.4)"}
                stroke={enabled ? "#ff4a3a" : "rgba(255,255,255,0.2)"}
                strokeWidth="2"
                className="transition-all duration-200"
              />
            ))}
          </svg>
        </div>

        {/* Preset Chips */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-accent" /> Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {presetList.map((preset) => {
              const active = currentPreset === preset && enabled;
              const emoji = PRESET_ICONS[preset] || "🎵";
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 border text-left",
                    active
                      ? "bg-accent text-white border-accent shadow-[0_0_12px_rgba(255,74,58,0.4)]"
                      : "bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  <span className="text-sm shrink-0">{emoji}</span>
                  <span className="truncate">{preset}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Band Equalizer Sliders */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="size-3.5 text-accent" /> Frequency Bands (-12dB to +12dB)
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-white/50 hover:text-white px-2"
              onClick={() => applyPreset("Flat")}
            >
              <RotateCcw className="size-3 mr-1" />
              Reset
            </Button>
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            {BANDS.map(({ label, role, index }) => {
              const val = bands[index] ?? 0;
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{label}</span>
                      <span className="text-[11px] text-white/40">{role}</span>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-xs tabular-nums font-semibold px-2 py-0.5 rounded transition-colors",
                        val > 0
                          ? "text-accent bg-accent/15 border border-accent/20"
                          : val < 0
                          ? "text-cyan-400 bg-cyan-400/15 border border-cyan-400/20"
                          : "text-white/40 bg-white/5",
                      )}
                    >
                      {val > 0 ? `+${val}` : val} dB
                    </span>
                  </div>
                  <Slider
                    value={[val]}
                    min={-12}
                    max={12}
                    step={1}
                    onValueChange={([newVal]) => {
                      if (typeof newVal === "number") setBand(index, newVal);
                    }}
                    disabled={!enabled}
                    className={cn(!enabled && "opacity-40")}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Bass Boost Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white/80 flex items-center gap-1.5">
              <Zap className="size-3.5 text-accent" /> Sub Bass Punch Boost
            </span>
            <span className="font-mono text-xs tabular-nums text-accent font-semibold bg-accent/15 px-2 py-0.5 rounded border border-accent/25">
              +{bassBoost} dB
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
            <Slider
              value={[bassBoost]}
              min={0}
              max={10}
              step={1}
              onValueChange={([newVal]) => {
                if (typeof newVal === "number") setBassBoost(newVal);
              }}
              disabled={!enabled}
              className={cn(!enabled && "opacity-40")}
            />
          </div>
        </div>

        {/* Sound Check / Volume Normalization */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 mt-1">
          <div className="space-y-0.5 pr-4">
            <p className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Volume2 className="size-3.5 text-white/70" /> Sound Check (Dynamic Loudness Normalization)
            </p>
            <p className="text-[11px] text-white/50">
              Balances track loudness using dynamic compression to eliminate sudden volume spikes between songs.
            </p>
          </div>
          <Switch
            checked={volumeNorm}
            onCheckedChange={toggleVolumeNorm}
            aria-label="Toggle Sound Check Normalization"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
