import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const [meteors, setMeteors] = useState<
    Array<{
      id: number;
      left: string;
      delay: string;
      duration: string;
    }>
  >([]);

  useEffect(() => {
    const generateMeteors = () => {
      const meteorsArray = new Array(number || 20).fill(true).map((_, idx) => ({
        id: idx,
        left: Math.floor(Math.random() * (100 - -100) + -100) + "%",
        delay: Math.random() * (1 - 0.2) + 0.2 + "s",
        duration: Math.floor(Math.random() * (20 - 5) + 5) + "s",
      }));
      setMeteors(meteorsArray);
    };

    generateMeteors();
  }, [number]);

  return (
    <>
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className={cn(
            "hidden md:block animate-[meteor-effect_linear_infinite] absolute top-[-50px] left-1/2 h-[0.1rem] w-[0.1rem] rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#ff4a3a88] before:to-transparent",
            className
          )}
          style={{
            top: 0,
            left: meteor.left,
            animationDelay: meteor.delay,
            animationDuration: meteor.duration,
          }}
        ></span>
      ))}
    </>
  );
};
