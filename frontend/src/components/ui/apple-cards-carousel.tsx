import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X, ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { ImageWithFallback } from "@/components/common/ImageWithFallback"

export interface CardData {
  src: string
  title: string
  category: string
  content: React.ReactNode
  tag?: string
  alt?: string
  onOpen?: () => void
}

interface CarouselContextType {
  onCardClose: (index: number) => void
  currentIndex: number
}

export const CarouselContext = createContext<CarouselContextType>({
  onCardClose: () => {},
  currentIndex: 0,
})

interface CarouselProps {
  items: React.ReactNode[]
  initialScroll?: number
  className?: string
}

export const Carousel: React.FC<CarouselProps> = ({
  items,
  initialScroll = 0,
  className,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  const checkScrollability = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      setCanScrollLeft(scrollLeft > 5)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
    }
  }, [])

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll
      checkScrollability()
    }
  }, [initialScroll, checkScrollability])

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: "smooth" })
    }
  }

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 260 : 340
      const gap = isMobile() ? 16 : 24
      const scrollPosition = (cardWidth + gap) * (index + 1)
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      })
      setCurrentIndex(index)
    }
  }

  const isMobile = () => {
    return typeof window !== "undefined" && window.innerWidth < 768
  }

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className={cn("relative w-full", className)}>
        {/* Navigation Buttons Row */}
        <div className="flex justify-end gap-2 pb-4 px-2">
          <button
            type="button"
            className="relative z-20 h-10 w-10 rounded-full bg-white/90 border border-purple-100 flex items-center justify-center text-slate-700 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-purple-50 hover:text-purple-700 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            disabled={!canScrollLeft}
            onClick={scrollLeft}
            aria-label="Scroll left in carousel"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="relative z-20 h-10 w-10 rounded-full bg-white/90 border border-purple-100 flex items-center justify-center text-slate-700 disabled:opacity-35 disabled:cursor-not-allowed hover:bg-purple-50 hover:text-purple-700 transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            disabled={!canScrollRight}
            onClick={scrollRight}
            aria-label="Scroll right in carousel"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Horizontal Track */}
        <div
          className="flex w-full overflow-x-auto overscroll-x-contain py-4 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          ref={carouselRef}
          onScroll={checkScrollability}
          tabIndex={0}
          role="region"
          aria-label="Carousel content"
        >
          <div className="flex flex-row justify-start gap-4 md:gap-6 pl-4 pr-12 max-w-7xl mx-auto">
            {items.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.4,
                    delay: 0.05 * index,
                    ease: "easeOut",
                  },
                }}
                key={"card" + index}
                className="last:pr-[5%] md:last:pr-[15%] rounded-3xl shrink-0"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </CarouselContext.Provider>
  )
}

interface CardProps {
  card: CardData
  index: number
  layout?: boolean
}

export const Card: React.FC<CardProps> = ({ card, index, layout = true }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { onCardClose } = useContext(CarouselContext)

  const handleOpen = () => {
    if (card.onOpen) {
      card.onOpen()
      return
    }
    setOpen(true)
  }

  const handleClose = useCallback(() => {
    setOpen(false)
    onCardClose(index)
  }, [index, onCardClose])

  // Outside click dismissal
  useOutsideClick(containerRef, () => {
    if (open) handleClose()
  })

  // Escape key listener & Body scroll lock cleanup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        handleClose()
      }
    }

    if (open) {
      window.addEventListener("keydown", handleKeyDown)
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"

      return () => {
        window.removeEventListener("keydown", handleKeyDown)
        document.body.style.overflow = originalOverflow
      }
    }
  }, [open, handleClose])

  return (
    <>
      {/* Expanded Modal Overlay */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-transparent"
              onClick={handleClose}
            />

            <motion.div
              ref={containerRef}
              layoutId={layout ? `card-${card.title}-${index}` : undefined}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative z-50 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-purple-100 dark:bg-zinc-900 dark:border-zinc-800 [scrollbar-width:thin]"
              role="dialog"
              aria-modal="true"
              aria-label={card.title}
            >
              {/* Close Button */}
              <button
                type="button"
                className="sticky top-4 float-right mr-4 z-50 h-9 w-9 rounded-full bg-white/90 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 hover:bg-purple-50 hover:text-purple-700 transition-colors shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                onClick={handleClose}
                aria-label="Close modal dialog"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header Hero Image */}
              <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-t-3xl bg-slate-100">
                <BlurImage
                  src={card.src}
                  alt={card.alt || card.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-6 left-6 right-16 text-white space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-purple-200 uppercase tracking-wider">
                    {card.category}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {card.title}
                  </h3>
                </div>
              </div>

              {/* Expanded Card Body */}
              <div className="p-6 sm:p-8 space-y-6 text-slate-700 dark:text-zinc-300">
                {card.content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collapsed Card Button */}
      <motion.button
        layoutId={layout ? `card-${card.title}-${index}` : undefined}
        onClick={handleOpen}
        type="button"
        className="group relative h-80 w-64 sm:h-96 sm:w-72 md:h-[420px] md:w-[320px] rounded-3xl overflow-hidden text-left bg-purple-50 dark:bg-zinc-900 border border-purple-100/80 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600/50 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        aria-haspopup="dialog"
      >
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden">
          <BlurImage
            src={card.src}
            alt={card.alt || card.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Subtle Multi-stage Gradient for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/10 transition-opacity group-hover:opacity-90" />
        </div>

        {/* Optional Top Tag */}
        {card.tag && (
          <div className="absolute top-4 left-4 z-10">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-purple-800 backdrop-blur-md shadow-xs">
              {card.tag}
            </span>
          </div>
        )}

        {/* Bottom Content Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 z-10 space-y-2 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-300">
            {card.category}
          </p>
          <h4 className="text-lg sm:text-xl font-extrabold text-white leading-tight group-hover:text-purple-100 transition-colors line-clamp-2">
            {card.title}
          </h4>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-200/90 pt-1 group-hover:text-white transition-colors">
            Tap to explore &rarr;
          </span>
        </div>
      </motion.button>
    </>
  )
}

interface BlurImageProps {
  src: string
  alt: string
  className?: string
}

export const BlurImage: React.FC<BlurImageProps> = ({ src, alt, className }) => {
  return (
    <ImageWithFallback
      src={src}
      alt={alt}
      className={className}
      containerClassName="w-full h-full"
      iconType="sparkles"
    />
  )
}
