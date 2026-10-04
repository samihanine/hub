import { Link, useSearch } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import { motion } from "motion/react";
import { NotFound } from "@/components/not-found";
import { findPresentation, PRESENTATIONS } from "@/presentations";
import { Player } from "./player";
import { PrintView } from "./print-view";

export function PresentationPage() {
  const { name, print } = useSearch({ from: "/presentation" });
  if (!name) return <PresentationList />;
  const presentation = findPresentation(name);
  if (!presentation)
    return (
      <NotFound title="Unknown presentation">
        No presentation "{name}" is declared in <code>src/presentations</code>.
      </NotFound>
    );
  if (print) return <PrintView presentation={presentation} />;
  return <Player key={presentation.name} presentation={presentation} />;
}

function PresentationList() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10">
      <p className="eyebrow">Guides</p>
      <h1 className="mt-4 font-title text-4xl">Presentations</h1>
      <span className="gold-rule mt-6 block" />
      <p className="mt-6 text-muted-foreground">
        Interactive presentations built around the report visuals.
      </p>
      <div className="mt-10 grid gap-px border bg-border sm:grid-cols-2">
        {PRESENTATIONS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.8 }}
          >
            <Link
              to="/presentation"
              search={{ name: p.name }}
              className="group relative flex h-full flex-col bg-card p-8 transition-colors duration-500 hover:bg-background"
            >
              <span className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gold transition-transform duration-700 group-hover:scale-x-100" />
              {p.context && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-[0.28em]">
                  {p.context}
                </span>
              )}
              <h2 className="mt-4 font-title text-2xl">{p.title}</h2>
              {p.subtitle && (
                <p className="mt-2 text-muted-foreground text-sm">
                  {p.subtitle}
                </p>
              )}
              <div className="mt-10 flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-[0.22em]">
                <span>
                  {p.slides.filter((s) => s.layout === "section").length} parts
                </span>
                <span className="h-3 w-px bg-border" />
                <span>{p.slides.length} pages</span>
                <ArrowRightIcon
                  className="ml-auto size-4 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-foreground"
                  strokeWidth={1.25}
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
