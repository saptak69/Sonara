import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { Link } from "@tanstack/react-router";

const promoCardVariants = cva(
  "relative overflow-hidden group cursor-pointer transition-all duration-500 block",
  {
    variants: {
      variant: {
        banner: "w-full aspect-[21/10] sm:aspect-[21/7] rounded-3xl",
        spotlight: "w-full aspect-[3/4] sm:aspect-[4/5] rounded-2xl",
        mosaic: "w-full aspect-square rounded-2xl",
        portal: "w-full aspect-[16/9] sm:aspect-[4/3] rounded-2xl bg-surface",
        recap: "w-full aspect-[16/9] rounded-2xl bg-ink-2",
      },
    },
    defaultVariants: {
      variant: "mosaic",
    },
  }
);

export interface PromoCardProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'title'>, VariantProps<typeof promoCardVariants> {
  title: string;
  subtitle?: string;
  badge?: string;
  image?: string;
  href?: string;
  titleClassName?: string;
}

export const PromoCard = React.forwardRef<HTMLAnchorElement, PromoCardProps>(
  ({ className, variant, title, subtitle, badge, image, href = "#", titleClassName, ...props }, ref) => {
    
    // Different visual treatments based on the variant
    const getTreatment = () => {
      switch (variant) {
        case "spotlight":
          return "saturate-50 contrast-125 sepia-[.3] group-hover:scale-110";
        case "mosaic":
          return "opacity-60 saturate-50 mix-blend-luminosity group-hover:scale-105 group-hover:opacity-80";
        case "banner":
          return "group-hover:scale-[1.02] saturate-150 opacity-90";
        default:
          return "group-hover:scale-105 opacity-80";
      }
    };

    return (
      <Link
        to={href}
        className={cn(promoCardVariants({ variant, className }))}
        {...props}
      >
        {/* Background Image & Texture */}
        {image && (
          <>
            <div className="absolute inset-0 z-0 bg-ink">
              <img 
                src={image} 
                alt={title} 
                className={cn(
                  "w-full h-full object-cover transition-all duration-1000 ease-out",
                  getTreatment()
                )}
              />
            </div>
            
            {/* Vignette / Gradient */}
            <div className={cn(
              "absolute inset-0 z-10 transition-opacity duration-500",
              variant === "banner" 
                ? "bg-gradient-to-t from-bg via-bg/40 to-transparent opacity-90"
                : variant === "spotlight"
                ? "bg-gradient-to-t from-bg via-bg/60 to-transparent opacity-100"
                : "bg-gradient-to-t from-bg via-transparent to-transparent opacity-90"
            )} />
            
            {/* Film Grain Texture Overlay */}
            <div className="absolute inset-0 z-10 mix-blend-overlay opacity-30 pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
            
            {/* Soft Light Leak for Mosaic/Portal */}
            {(variant === "mosaic" || variant === "portal") && (
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/20 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            )}
          </>
        )}

        {/* Content Area - Safe Zone */}
        <div className={cn(
          "relative z-20 w-full h-full flex flex-col justify-end p-6",
          variant === "banner" ? "sm:p-10" : "sm:p-8"
        )}>
          
          {/* Badge */}
          {badge && (
            <div className="mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-[10px] font-bold tracking-[0.2em] text-accent uppercase backdrop-blur-md">
                {badge}
              </span>
            </div>
          )}

          {/* Typography */}
          <div className={cn(
            "space-y-2 transition-transform duration-500", 
            variant !== "portal" && "transform translate-y-2 group-hover:translate-y-0"
          )}>
            {variant !== "portal" && (
              <h3 className={cn(
                "font-display tracking-tight text-fg drop-shadow-lg",
                variant === "banner" ? "text-4xl sm:text-6xl font-medium" : "",
                variant === "spotlight" ? "text-3xl sm:text-4xl leading-tight font-medium" : "",
                variant === "mosaic" ? "text-2xl sm:text-3xl font-medium" : "",
                variant === "recap" ? "text-3xl text-accent" : "",
                titleClassName
              )}>
                {title}
              </h3>
            )}
            
            {subtitle && variant !== "portal" && (
              <p className="font-sans text-muted text-sm sm:text-base font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Copper Borders */}
          {variant === "mosaic" && (
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent/20 rounded-2xl transition-colors duration-500 pointer-events-none" />
          )}

        </div>
        
        {/* Portal Centered Text Override */}
        {variant === "portal" && (
           <div className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-none">
             <h3 className={cn("font-display text-4xl sm:text-5xl text-center text-fg group-hover:text-accent transition-colors duration-500 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]", titleClassName)}>
               {title}
             </h3>
           </div>
        )}
      </Link>
    );
  }
);
PromoCard.displayName = "PromoCard";
