import React from "react";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import {
  Avatar,
  Button,
  Card,
  CardFooter,
  CardHeader,
  Image,
} from "@heroui/react";
import Link from "next/link";

import { DotButton, useDotButton } from "./carousel-dot";
import { PrevButton, NextButton, usePrevNextButtons } from "./carousel-arrow";

type BannerCardProps = {
  tag: string;
  title: string;
  bgImage: string;
  footerTitle: string;
  buttonText: string;
  link?: string;
  linkTarget?: string;
};

type PropType = {
  slides: BannerCardProps[];
  options?: EmblaOptionsType;
};

function BannerCard({
  tag,
  title,
  bgImage,
  footerTitle,
  buttonText,
  link,
  linkTarget = "_self",
}: BannerCardProps) {
  return (
    <Card
      isFooterBlurred
      className="relative w-full h-[280px] sm:h-[300px] lg:h-60 col-span-12 sm:col-span-6 lg:col-span-4 shadow-none border border-default-200 p-0"
    >
      <CardHeader className="absolute z-10 top-1 flex-col items-start px-3 sm:px-4">
        <p className="text-[10px] sm:text-tiny text-white/60 uppercase font-bold">
          {tag}
        </p>
        <h4 className="text-white/90 font-medium text-base sm:text-xl">
          {title}
        </h4>
      </CardHeader>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <Image
          removeWrapper
          alt={`${tag} background`}
          className="z-0 h-40"
          src={bgImage}
        />
      </div>
      <CardFooter className="absolute bg-primary top-0 z-10 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex grow gap-2 items-center min-w-0">
          <Avatar
            className="bg-transparent"
            size="sm"
            src={"/logo-white.png"}
          />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-lg text-white truncate">{footerTitle}</span>
          </div>
        </div>
        {link ? (
          <Link href={link} target={linkTarget}>
            <Button
              className="shrink-0 text-xs sm:text-sm"
              color="primary"
              radius="full"
              size="sm"
              variant="faded"
            >
              {buttonText}
            </Button>
          </Link>
        ) : (
          <Button
            isDisabled
            className="shrink-0 text-xs sm:text-sm"
            radius="full"
            size="sm"
            variant="faded"
          >
            {buttonText}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

const CarouselBanner: React.FC<PropType> = (props) => {
  const { slides, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <section className="embla">
      <div ref={emblaRef} className="embla__viewport">
        <div className="embla__container">
          {slides.map((card, index) => (
            <div key={index} className="embla__slide">
              <BannerCard {...card} />
            </div>
          ))}
        </div>
      </div>

      <div className="embla__controls">
        <div className="embla__buttons">
          <PrevButton disabled={prevBtnDisabled} onClick={onPrevButtonClick} />
          <NextButton disabled={nextBtnDisabled} onClick={onNextButtonClick} />
        </div>

        <div className="embla__dots">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              className={"embla__dot".concat(
                index === selectedIndex ? " embla__dot--selected" : "",
              )}
              onClick={() => onDotButtonClick(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CarouselBanner;
