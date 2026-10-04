import { Link } from "@tanstack/react-router";
import { CompassIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFound({
  title = "Page not found",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid flex-1 place-items-center p-10 text-center">
      <div className="max-w-sm">
        <CompassIcon
          className="mx-auto mb-5 size-6 text-gold"
          strokeWidth={1.25}
        />
        <h1 className="font-title text-2xl">{title}</h1>
        <div className="mt-1 text-muted-foreground text-sm">
          {children ?? "This link leads nowhere."}
        </div>
        <Button
          asChild
          variant="outline"
          className="mt-8 text-[10px] uppercase tracking-[0.24em]"
        >
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
