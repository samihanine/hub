import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { BrandMark } from "../monogram";
import {
  CONTENT,
  ease,
  type Lead,
  LeadBand,
  Markdown,
  Page,
  picture,
} from "../ui";
import { defineLayout } from "./define";

/**
 * Free text in a centered frame. `markdown`: paragraphs, "## " / "### " headings, "- " lists,
 * "> " quotes, **bold**, *italic*, ==gold==. Optional picture on the right of the frame.
 */
export type MarkdownSlide = {
  layout: "markdown";
  title: string;
  lead: Lead;
  markdown: string;
  image?: string;
};

export const markdown = defineLayout<MarkdownSlide>({
  chrome: true,
  Component: ({ slide }) => (
    <Page className={cn(CONTENT, "flex flex-col")}>
      <LeadBand lead={slide.lead} />
      <div className="grid min-h-0 flex-1 place-items-center pt-[2.8cqw]">
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 18, scale: 0.98 },
            show: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 1.2, ease },
            },
          }}
          className={cn(
            "relative grid h-full max-h-[33cqw] w-full overflow-hidden border border-foreground/10 bg-white shadow-[0_1.4cqw_3.6cqw_-2.4cqw_rgb(60_45_20/0.3)]",
            slide.image
              ? "max-w-[80cqw] grid-cols-[1.15fr_1fr]"
              : "max-w-[62cqw]",
          )}
        >
          <span className="absolute inset-x-0 top-0 h-[0.15cqw] bg-[var(--tone)]" />
          <div className="relative flex min-h-0 flex-col justify-center overflow-y-auto px-[4cqw] py-[3cqw]">
            <Markdown
              text={slide.markdown}
              className="text-[1.2cqw] text-foreground/85 leading-relaxed"
            />
            <BrandMark
              className="absolute right-[1.6cqw] bottom-[1.4cqw] w-[2.6cqw]"
              delay={1.2}
            />
          </div>
          {slide.image && (
            <motion.div
              variants={{
                hidden: { clipPath: "inset(0 0 0 100%)" },
                show: {
                  clipPath: "inset(0 0 0 0%)",
                  transition: { duration: 1.6, ease, delay: 0.3 },
                },
              }}
              className="overflow-hidden"
            >
              <img
                src={picture(slide.image, 1200)}
                alt=""
                className="size-full object-cover"
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </Page>
  ),
});
