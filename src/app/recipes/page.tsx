import { CategoryWorkspace } from "@/components/CategoryWorkspace";

export default function RecipesPage() {
  return (
    <div>
      <p className="mb-6 text-stone-700">
        把今天想做的菜、便当灵感随手贴在这里。
      </p>
      <CategoryWorkspace category="recipes" />
    </div>
  );
}
