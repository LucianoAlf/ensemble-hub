/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuração de headers de segurança
  async headers() {
    return [
      {
        // Aplicar headers de segurança a todas as rotas
        source: '/(.*)',
        headers: [
          // Content Security Policy (CSP)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://maps.gstatic.com https://maps.googleapis.com https://streetviewpixels-pa.googleapis.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          
          // X-Frame-Options (proteção contra clickjacking)
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          
          // X-Content-Type-Options (previne MIME sniffing)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          
          // X-XSS-Protection (proteção XSS legacy)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          
          // Strict Transport Security (HTTPS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          
          // Permissions Policy (controle de APIs do browser)
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=(self)',
              'interest-cohort=()'
            ].join(', ')
          },
          
          // Cross-Origin Embedder Policy
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless'
          },
          
          // Cross-Origin Opener Policy
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          
          // Cross-Origin Resource Policy
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          }
        ]
      },
      
      // Headers específicos para API routes
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; script-src 'none'; style-src 'none'"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ];
  },
  
  // Configuração de imagens otimizadas
  images: {
    domains: [
      'maps.gstatic.com',
      'maps.googleapis.com',
      'streetviewpixels-pa.googleapis.com'
    ],
    formats: ['image/webp', 'image/avif']
  },
  
  // Configuração experimental para melhor performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  },
  
  // Configuração de compressão
  compress: true,
  
  // Configuração de trailing slash
  trailingSlash: false,
  
  // Configuração de redirecionamentos de segurança
  async redirects() {
    return [
      // Redirecionar HTTP para HTTPS em produção
      {
        source: '/(.*)',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http'
          }
        ],
        destination: 'https://seu-dominio.com/$1',
        permanent: true
      }
    ];
  },
  
  // Configuração de rewrites para segurança
  async rewrites() {
    return [
      // Ocultar rotas administrativas
      {
        source: '/admin/:path*',
        destination: '/404'
      }
    ];
  }
};

module.exports = nextConfig;
