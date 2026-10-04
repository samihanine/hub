import { ArrowUpRightIcon } from "lucide-react";
import { motion } from "motion/react";
import {
  HOME,
  POWER_APPS,
  SHORTCUT_COLORS,
  SHORTCUT_GROUPS,
  type Shortcut,
} from "@/lib/app-config";
import { isAdmin, useCurrentUser } from "@/lib/power-apps";

const ease = [0.22, 1, 0.36, 1] as const;

export function HomePage() {
  const { data: user } = useCurrentUser();
  const admin = isAdmin(user?.email);
  // Admin-only shortcuts for admins; table shortcuts only with Power Apps; empty groups hidden.
  const groups = SHORTCUT_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        (admin || !item.adminOnly) &&
        (POWER_APPS || !item.href.startsWith("/tables")),
    ),
  })).filter((group) => group.items.length);
  let index = 0;
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10">
      <p className="eyebrow">{HOME.eyebrow}</p>
      <h1 className="mt-2 font-title text-3xl">{HOME.title}</h1>

      <div className="mt-8 space-y-10">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="eyebrow mb-3">{group.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <ShortcutCard
                  key={item.title + item.href}
                  item={item}
                  index={index++}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ShortcutCard({ item, index }: { item: Shortcut; index: number }) {
  const internal = item.href.startsWith("/");
  const Icon = item.icon;
  const color = item.color ?? SHORTCUT_COLORS[index % SHORTCUT_COLORS.length];

  return (
    <motion.a
      // Hash history: "#/tables?name=task" is a link inside the app.
      href={internal ? `#${item.href}` : item.href}
      target={internal ? undefined : "_blank"}
      rel={internal ? undefined : "noreferrer"}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: index * 0.04, ease }}
      style={{ "--tone": color } as React.CSSProperties}
      className="group relative flex h-32 items-center gap-5 border border-transparent bg-background px-6 outline-none transition-colors duration-500 hover:border-[var(--tone)] focus-visible:border-[var(--tone)]"
    >
      <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[var(--tone)]/15 text-[var(--tone)] transition-all duration-500 group-hover:scale-105 group-hover:bg-[var(--tone)] group-hover:text-white">
        <Icon className="size-7" strokeWidth={1.3} />
      </span>
      <span className="min-w-0 font-title text-lg leading-snug">
        {item.title}
      </span>
      {!internal && (
        <ArrowUpRightIcon
          className="absolute top-4 right-4 size-4 text-muted-foreground/60"
          strokeWidth={1.25}
        />
      )}
    </motion.a>
  );
}
