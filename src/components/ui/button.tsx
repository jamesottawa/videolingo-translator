import { cn } from "../../lib/utils";

export function Button({ className, variant, size, asChild = false, ...props }: any) {
  // Simple stub for UI
  return <button className={cn("px-4 py-2 font-medium rounded-md", className)} {...props} />;
}
