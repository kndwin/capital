import { createFileRoute } from "@tanstack/react-router";
import {
  ModuleLayout,
  ModuleLayoutBody,
  ModuleLayoutHeader,
  ModuleLayoutTitle,
} from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <ModuleLayoutTitle>Capital</ModuleLayoutTitle>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        <div className="flex min-h-full items-center justify-center text-sm text-muted-foreground">
          No modules are enabled yet.
        </div>
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
