import { CategoryWorkspace } from "@/components/CategoryWorkspace";

export default function GroceryPage() {
  return (
    <div>
      <p className="mb-6 text-stone-700">
        超市清单、想买的零食，贴一张就不会忘。
      </p>
      <CategoryWorkspace category="grocery" />
    </div>
  );
}
