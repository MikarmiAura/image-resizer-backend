/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { 
            key: "Access-Control-Allow-Origin", 
            value: "https://oualator.com"
          },
          { 
            key: "Access-Control-Allow-Methods", 
            value: "POST, OPTIONS" 
          },
          { 
            key: "Access-Control-Allow-Headers", 
            value: "Content-Type, Authorization" 
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400"
          }
        ],
      },
    ];
  },
  
  swcMinify: true,
};

module.exports = nextConfig;
