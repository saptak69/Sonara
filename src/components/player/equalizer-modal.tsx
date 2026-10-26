import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { usePlayer, EQUALIZER_PRESETS, type EqualizerPresetName } from "@/lib/player-store";
import { Sliders, Volume2, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const BANDS = [
  { label: "60 Hz", role: "Sub-Bass", index: 0, xPercent: 12 },
  { label: "250 Hz", role: "Bass", index: 1, xPercent: 31 },
  { label: "1 kHz", role: "Mids", index: 2, xPercent: 50 },
  { label: "4 kHz", role: "Presence", index: 3, xPercent: 69 },
  { label: "12 kHz", role: "Treble", index: 4, xPercent: 88 },
];

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

  const svgWidth = 400;
  const svgHeight = 120;
  const centerY = 60;

  const points = BANDS.map((b) => {
    const gain = enabled ? (bands[b.index] ?? 0) : 0;
    const extraBass = b.index === 0 && enabled ? bassBoost * 0.75 : b.index === 1 && enabled ? bassBoost * 0.35 : 0;
    const effectiveGain = Math.max(-12, Math.min(14, gain + extraBass));
    const x = (b.xPercent / 100) * svgWidth;
    const y = centerY - (effectiveGain / 12) * 44;
    return { x, y, gain: effectiveGain };
  });

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
      <DialogContent className="max-w-[480px] max-h-[90vh] overflow-y-auto bg-surface border border-white/[0.08] text-white rounded-2xl p-6 shadow-2xl [scrollbar-width:thin]">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-surface -mx-6 -mt-6 p-6 pb-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-white/[0.06] border border-white/[0.08] grid place-items-center text-accent">
              <Sliders className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
                Studio Equalizer
                {enabled && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/30">
                    Active
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-white/50 text-xs">
                5-Band Graphic DSP & Audio Dynamics
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pr-1">
              <span className="text-xs text-white/70 font-medium">
                {enabled ? "On" : "Off"}
              </span>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                aria-label="Toggle Equalizer"
              />
            </div>
            <DialogClose className="grid size-8 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
              <X className="size-4" />
            </DialogClose>
          </div>
        </div>

        {/* Live SVG Frequency Response Curve */}
        <div className="relative w-full h-[120px] mt-4 rounded-xl bg-black/40 border border-white/[0.06] overflow-hidden select-none">
          <div className="absolute inset-x-0 top-[14px] border-b border-white/[0.04] flex justify-between px-3 text-[9px] font-mono text-white/30">
            <span>+12 dB</span>
            <span className="text-white/20">HIGH SHELF</span>
          </div>
          <div className="absolute inset-x-0 top-[60px] border-b border-white/[0.08] border-dashed flex justify-between px-3 text-[9px] font-mono text-white/40">
            <span>0 dB</span>
            <span className="text-white/20">FLAT</span>
          </div>
          <div className="absolute inset-x-0 bottom-[14px] border-t border-white/[0.04] flex justify-between px-3 text-[9px] font-mono text-white/30">
            <span>-12 dB</span>
            <span className="text-white/20">LOW CUT</span>
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="eq-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5B2E" stopOpacity={enabled ? "0.2" : "0.04"} />
                <stop offset="100%" stopColor="#FF5B2E" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <path d={fillD} fill="url(#eq-gradient)" className="transition-all duration-200" />
            <path
              d={pathD}
              fill="none"
              stroke={enabled ? "#FF5B2E" : "rgba(255,255,255,0.2)"}
              strokeWidth="2"
              strokeLinecap="round"
              className="transition-all duration-200"
            />
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill={enabled ? "#FFFFFF" : "rgba(255,255,255,0.3)"}
                stroke={enabled ? "#FF5B2E" : "rgba(255,255,255,0.2)"}
                strokeWidth="1.5"
                className="transition-all duration-200"
              />
            ))}
          </svg>
        </div>

        {/* Controls Container — Dimmed when disabled */}
        <div className={cn("space-y-5 pt-3 transition-opacity duration-200", !enabled && "opacity-45 pointer-events-none")}>
          {/* Preset Chips (Text-only, no emoji) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Presets</label>
            <div className="flex flex-wrap gap-1.5">
              {presetList.map((preset) => {
                const active = currentPreset === preset && enabled;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                      active
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "bg-white/[0.05] text-white/70 border border-white/[0.06] hover:bg-white/[0.09] hover:text-white",
                    )}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5-Band Equalizer Sliders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/60">
                Frequency Bands (-12dB to +12dB)
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] text-white/40 hover:text-white px-2"
                onClick={() => applyPreset("Flat")}
              >
                <RotateCcw className="size-3 mr-1" />
                Reset
              </Button>
            </div>

            <div className="space-y-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              {BANDS.map(({ label, role, index }) => {
                const val = bands[index] ?? 0;
                return (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{label}</span>
                        <span className="text-[11px] text-white/40">{role}</span>
                      </div>
                      <span className="font-mono text-xs tabular-nums text-white/60">
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
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bass Boost Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-white/70">Sub-Bass Punch</span>
              <span className="font-mono text-xs tabular-nums text-accent">
                +{bassBoost} dB
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <Slider
                value={[bassBoost]}
                min={0}
                max={10}
                step={1}
                onValueChange={([newVal]) => {
                  if (typeof newVal === "number") setBassBoost(newVal);
                }}
                disabled={!enabled}
              />
            </div>
          </div>

          {/* Sound Check / Volume Normalization */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="space-y-0.5 pr-4">
              <p className="text-xs font-medium text-white flex items-center gap-1.5">
                <Volume2 className="size-3.5 text-white/60" /> Sound Check
              </p>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Normalizes audio volume to eliminate sudden level jumps between tracks.
              </p>
            </div>
            <Switch
              checked={volumeNorm}
              onCheckedChange={toggleVolumeNorm}
              aria-label="Toggle Sound Check Normalization"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
