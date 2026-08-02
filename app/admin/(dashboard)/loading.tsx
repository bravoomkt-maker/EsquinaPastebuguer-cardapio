import { Spinner } from "@/components/ui/Spinner";

export default function AdminLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
