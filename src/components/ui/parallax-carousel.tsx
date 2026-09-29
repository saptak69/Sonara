import React, { useCallback, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";

interface ParallaxCarouselProps {
  images: string[];
}

export const ParallaxCarousel = ({ images }: ParallaxCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, dragFree: true },
    [
      AutoScroll({
        playOnInit: true,
        speed: 1,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ]
  );

  const tweenNodes = useRef<HTMLElement[]>([]);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;

    const engine = emblaApi.internalEngine();
    const scrollProgress = emblaApi.scrollProgress();

    emblaApi.scrollSnapList().forEach((scrollSnap, index) => {
      let diffToTarget = scrollSnap - scrollProgress;

      if (engine.options.loop) {
        engine.slideLooper.loopPoints.forEach((loopItem) => {
          const target = loopItem.target();
          if (index === loopItem.index && target !== 0) {
            const sign = Math.sign(target);
            if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
            if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
          }
        });
      }

      // Calculate parallax translation value
      const translateX = diffToTarget * -20; // 20% parallax effect
      
      const node = tweenNodes.current[index];
      if (node) {
        node.style.transform = `translate3d(${translateX}%, 0px, 0px)`;
      }
    });
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onScroll();
    emblaApi.on("scroll", onScroll);
    emblaApi.on("reInit", onScroll);

    return () => {
      emblaApi.off("scroll", onScroll);
      emblaApi.off("reInit", onScroll);
    };
  }, [emblaApi, onScroll]);

  return (
    <div
      className="overflow-hidden w-[120%] -mx-[10%] md:w-full md:mx-0 absolute right-0 top-1/2 -translate-y-1/2 z-0 opacity-40 pointer-events-auto"
      ref={emblaRef}
    >
      <div className="flex touch-pan-y -ml-4 py-8">
        {images.map((src, index) => (
          <div
            className="min-w-0 flex-[0_0_60%] sm:flex-[0_0_40%] md:flex-[0_0_30%] lg:flex-[0_0_20%] pl-4"
            key={index}
          >
            <div className="relative rounded-2xl overflow-hidden aspect-square w-full shadow-2xl group border border-white/10">
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-black">
                {/* Parallax Image */}
                <img
                  ref={(el) => {
                    if (el) tweenNodes.current[index] = el;
                  }}
                  className="absolute block w-[150%] max-w-none h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  src={src}
                  alt="Music Cover"
                  style={{
                    transform: `translate3d(0px, 0px, 0px)`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
