/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const backendTarget = process.env.NEXT_PUBLIC_API_URL
    || (isProduction
        ? 'https://likes-pdf-backend-production-668e.up.railway.app'
        : 'http://127.0.0.1:8000');

const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['localhost'],
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${backendTarget}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
