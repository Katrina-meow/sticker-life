import { CategoryWorkspace } from "@/components/CategoryWorkspace";
import { CATEGORY_INTRO } from "@/lib/categoryConfig";

type PageProps = {
  params: Promise<{ categoryId: string }>;
};

export default async function CategoryPage({ params }: PageProps) {
  const { categoryId } = await params;
  const intro =
    CATEGORY_INTRO[categoryId] ??
    "记录生活碎片；点击画板或日历空白处可取消贴纸选中。";

  return (
    <div>
      <p className="mb-6 text-stone-700">{intro}</p>
      <CategoryWorkspace categoryId={categoryId} />
    </div>
  );
}
