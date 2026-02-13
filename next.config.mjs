/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-markdown", "vfile", "vfile-message", "unified", "remark-parse", "remark-rehype", "rehype-stringify", "hast-util-to-jsx-runtime"]
};

export default nextConfig;
