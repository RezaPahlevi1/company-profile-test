import { lazy} from "react";

const HeroBlock = lazy(() => import("./blocks/shared/HeroBlock"));
const CtaBlock = lazy(() => import("./blocks/shared/CtaBlock"));
const RichTextBlock = lazy(() => import("./blocks/shared/RichTextBlock"));
const ImageTextBlock = lazy(() => import("./blocks/shared/ImageTextBlock"));
const IconGridBlock = lazy(() => import("./blocks/shared/IconGridBlock"));
const ProductsPreviewBlock = lazy(() => import("./blocks/shared/ProductsPreviewBlock"));
const ServicesPreviewBlock = lazy(() => import("./blocks/shared/ServicesPreviewBlock"));
const BlogPreviewBlock = lazy(() => import("./blocks/shared/BlogPreviewBlock"));
const StatsBlock = lazy(() => import("./blocks/home/StatsBlock"));
const AboutSnippetBlock = lazy(() => import("./blocks/home/AboutSnippetBlock"));
const TimelineBlock = lazy(() => import("./blocks/about/TimelineBlock"));
const TeamGridBlock = lazy(() => import("./blocks/about/TeamGridBlock"));
const StoryBlock = lazy(() => import("./blocks/about/StoryBlock"));

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
