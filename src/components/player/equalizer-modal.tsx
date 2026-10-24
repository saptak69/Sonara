import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { usePlayer, EQUALIZER_PRESETS, type EqualizerPresetName } from "@/lib/player-store";
import { Sliders, Sparkles, Volume2, X, RotateCcw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const BANDS = [
  { label: "60 Hz", role: "Sub-Bass", index: 0 },
  { label: "250 Hz", role: "Bass", index: 1 },
  { label: "1 kHz", role: "Mids", index: 2 },
  { label: "4 kHz", role: "Presence", index: 3 },
  { label: "12 kHz", role: "Treble", index: 4 },
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-zinc-950/95 border-white/10 text-white backdrop-blur-2xl [scrollbar-width:thin]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-accent/20 border border-accent/30 grid place-items-center text-accent">
              <Sliders className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Audio Equalizer
                {enabled && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent px-2 py-0.5 rounded-full border border-accent/30">
                    Active
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-white/50 text-xs mt-0.5">
                5-Band Graphic DSP & Bass Boost engine
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pr-2">
              <span className="text-xs text-white/70 font-medium">EQ</span>
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

        {/* Preset Chips */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-accent" /> Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presetList.map((preset) => {
              const active = currentPreset === preset && enabled;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 border",
                    active
                      ? "bg-accent text-white border-accent shadow-[0_0_12px_rgba(255,74,58,0.4)]"
                      : "bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/[0.08] hover:text-white",
                  )}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Band Equalizer Sliders */}
        <div className="space-y-4 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Frequency Bands (-12dB to +12dB)
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-white/50 hover:text-white px-2"
              onClick={() => applyPreset("Flat")}
            >
              <RotateCcw className="size-3 mr-1" />
              Reset Bands
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
                        "font-mono text-xs tabular-nums font-semibold px-1.5 py-0.5 rounded",
                        val > 0
                          ? "text-accent bg-accent/10"
                          : val < 0
                          ? "text-blue-400 bg-blue-400/10"
                          : "text-white/40",
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
              <Zap className="size-3.5 text-accent" /> Bass Boost
            </span>
            <span className="font-mono text-xs tabular-nums text-accent font-semibold">
              +{bassBoost} dB
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
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
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 mt-2">
          <div className="space-y-0.5 pr-4">
            <p className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Volume2 className="size-3.5 text-white/70" /> Sound Check (Loudness Normalization)
            </p>
            <p className="text-[11px] text-white/50">
              Balances playback loudness to eliminate sudden volume changes between tracks.
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
