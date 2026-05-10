import { CategoryWorkspace } from "@/components/CategoryWorkspace";

export default function FidgetPage() {
  return (
    <div>
      <p className="mb-6 text-stone-700">
        捏捏乐、解压小物，用贴纸留住可爱瞬间。
      </p>
      <CategoryWorkspace category="fidget" />
    </div>
  );
}
