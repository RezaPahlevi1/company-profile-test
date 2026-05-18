import HeroBlock from "./blocks/shared/HeroBlock";
import CtaBlock from "./blocks/shared/CtaBlock";
import RichTextBlock from "./blocks/shared/RichTextBlock";
import ImageTextBlock from "./blocks/shared/ImageTextBlock";
import IconGridBlock from "./blocks/shared/IconGridBlock";
import ProductsPreviewBlock from "./blocks/shared/ProductsPreviewBlock";
import ServicesPreviewBlock from "./blocks/shared/ServicesPreviewBlock";
import BlogPreviewBlock from "./blocks/shared/BlogPreviewBlock";
import StatsBlock from "./blocks/home/StatsBlock";
import AboutSnippetBlock from "./blocks/home/AboutSnippetBlock";
import TimelineBlock from "./blocks/about/TimelineBlock";
import TeamGridBlock from "./blocks/about/TeamGridBlock";
import StoryBlock from "./blocks/about/StoryBlock";

const BLOCK_COMPONENTS = {
  hero: HeroBlock,
  cta: CtaBlock,
  rich_text: RichTextBlock,
  image_text: ImageTextBlock,
  icon_grid: IconGridBlock,
  products_preview: ProductsPreviewBlock,
  services_preview: ServicesPreviewBlock,
  blog_preview: BlogPreviewBlock,
  stats: StatsBlock,
  about_snippet: AboutSnippetBlock,
  timeline: TimelineBlock,
  team_grid: TeamGridBlock,
  story: StoryBlock,
};

export default function BlockRenderer({ block, siteSettings }) {
  if (!block?.visible) return null;

  const Component = BLOCK_COMPONENTS[block.type];

  if (!Component) {
    console.warn(`[BlockRenderer] Unknown block type: "${block.type}"`);
    return null;
  }

  const design = block.design || {};
  let backgroundStyle = {};

  if (design.bgType === "color" && design.bgColor) {
    backgroundStyle.backgroundColor = design.bgColor;
  } else if (design.bgType === "gradient") {
    const dir = design.gradientDirection || "to right";
    const start = design.gradientStart || "#3b82f6";
    const end = design.gradientEnd || "#9333ea";
    backgroundStyle.background = `linear-gradient(${dir}, ${start}, ${end})`;
  }

  const isCustomBg = design.bgType === "color" || design.bgType === "gradient";

  // ✅ Pass design ke setiap block — dibutuhkan CTA untuk card color
  if (!isCustomBg) {
    return (
      <Component
        content={block.content || {}}
        siteSettings={siteSettings}
        isCustomBg={false}
        design={design}
      />
    );
  }

  return (
    <div
      style={backgroundStyle}
      className="w-full relative transition-colors duration-300"
    >
      <Component
        content={block.content || {}}
        siteSettings={siteSettings}
        isCustomBg={true}
        design={design}
      />
    </div>
  );
}
