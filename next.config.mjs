import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [["remark-gfm"], ["remark-math"]],
    rehypePlugins: [["rehype-katex"]],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // The project README documents this repo; no generated agent files needed.
  agentRules: false,
};

export default withMDX(nextConfig);
