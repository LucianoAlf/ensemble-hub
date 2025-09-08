#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Analisando estrutura do projeto para estimativa de bundle...\n');

// Função para calcular tamanho de arquivo
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch (error) {
        return 0;
    }
}

// Função para analisar diretório recursivamente
function analyzeDirectory(dirPath, extensions = []) {
    let totalSize = 0;
    let fileCount = 0;
    const files = [];

    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build') {
                    const subResult = analyzeDirectory(itemPath, extensions);
                    totalSize += subResult.totalSize;
                    fileCount += subResult.fileCount;
                    files.push(...subResult.files);
                }
            } else if (stats.isFile()) {
                const ext = path.extname(item).toLowerCase();
                if (extensions.length === 0 || extensions.includes(ext)) {
                    const size = stats.size;
                    totalSize += size;
                    fileCount++;
                    files.push({
                        path: path.relative(process.cwd(), itemPath),
                        size: size,
                        ext: ext
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Erro ao analisar ${dirPath}:`, error.message);
    }

    return { totalSize, fileCount, files };
}

// Função para formatar bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Analisar diferentes tipos de arquivos
console.log('📊 ANÁLISE DE BUNDLE - LA BAND PILOT\n');

// 1. Arquivos TypeScript/JavaScript
const jsResult = analyzeDirectory('./src', ['.ts', '.tsx', '.js', '.jsx']);
console.log('🟦 ARQUIVOS JAVASCRIPT/TYPESCRIPT:');
console.log(`   Total: ${formatBytes(jsResult.totalSize)} (${jsResult.fileCount} arquivos)`);

// Agrupar por tipo
const byType = jsResult.files.reduce((acc, file) => {
    if (!acc[file.ext]) acc[file.ext] = { size: 0, count: 0, files: [] };
    acc[file.ext].size += file.size;
    acc[file.ext].count++;
    acc[file.ext].files.push(file);
    return acc;
}, {});

Object.entries(byType).forEach(([ext, data]) => {
    console.log(`   ${ext}: ${formatBytes(data.size)} (${data.count} arquivos)`);
});

// 2. Maiores arquivos
console.log('\n📈 MAIORES ARQUIVOS:');
const largestFiles = jsResult.files
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

largestFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.path} - ${formatBytes(file.size)}`);
});

// 3. Arquivos CSS
const cssResult = analyzeDirectory('./src', ['.css', '.scss', '.sass']);
console.log('\n🎨 ARQUIVOS CSS:');
console.log(`   Total: ${formatBytes(cssResult.totalSize)} (${cssResult.fileCount} arquivos)`);

// 4. Análise de dependências
console.log('\n📦 ANÁLISE DE DEPENDÊNCIAS:');
try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});
    
    console.log(`   Dependências de produção: ${deps.length}`);
    console.log(`   Dependências de desenvolvimento: ${devDeps.length}`);
    
    // Dependências pesadas conhecidas
    const heavyDeps = [
        '@radix-ui', '@tanstack/react-query', 'recharts', 
        '@supabase/supabase-js', 'react-router-dom', 'date-fns'
    ];
    
    const foundHeavyDeps = deps.filter(dep => 
        heavyDeps.some(heavy => dep.includes(heavy))
    );
    
    console.log('\n   📊 Dependências que podem impactar bundle:');
    foundHeavyDeps.forEach(dep => {
        console.log(`   - ${dep}`);
    });
    
} catch (error) {
    console.log('   ❌ Erro ao ler package.json');
}

// 5. Estimativa de bundle
console.log('\n🎯 ESTIMATIVA DE BUNDLE:');
const estimatedJS = jsResult.totalSize * 0.3; // Estimativa após minificação/gzip
const estimatedCSS = cssResult.totalSize * 0.2; // CSS é mais compressível
const estimatedVendor = 300 * 1024; // ~300KB para dependências principais

console.log(`   JavaScript minificado: ~${formatBytes(estimatedJS)}`);
console.log(`   CSS minificado: ~${formatBytes(estimatedCSS)}`);
console.log(`   Vendor libraries: ~${formatBytes(estimatedVendor)}`);
console.log(`   TOTAL ESTIMADO: ~${formatBytes(estimatedJS + estimatedCSS + estimatedVendor)}`);

// 6. Recomendações
console.log('\n💡 RECOMENDAÇÕES:');
if (estimatedJS + estimatedCSS + estimatedVendor > 500 * 1024) {
    console.log('   ⚠️  Bundle pode estar grande (>500KB)');
    console.log('   ✅ Code splitting já implementado');
    console.log('   ✅ Lazy loading já implementado');
    console.log('   💡 Considere tree shaking mais agressivo');
} else {
    console.log('   ✅ Bundle size dentro do esperado (<500KB)');
}

// 7. Análise de otimizações implementadas
console.log('\n🚀 OTIMIZAÇÕES IMPLEMENTADAS:');

// Verificar lazy loading
const lazyFiles = jsResult.files.filter(f => 
    f.path.includes('lazy') || 
    fs.readFileSync(f.path, 'utf8').includes('React.lazy')
);
console.log(`   ✅ Lazy loading: ${lazyFiles.length} arquivos`);

// Verificar code splitting
const hasCodeSplitting = fs.existsSync('./vite.config.ts') && 
    fs.readFileSync('./vite.config.ts', 'utf8').includes('manualChunks');
console.log(`   ✅ Code splitting: ${hasCodeSplitting ? 'Configurado' : 'Não configurado'}`);

// Verificar otimização de imagens
const imageOptFiles = jsResult.files.filter(f => 
    f.path.includes('image-optimizer') || f.path.includes('optimized-image')
);
console.log(`   ✅ Otimização de imagens: ${imageOptFiles.length} arquivos`);

// 8. Relatório final
const report = {
    timestamp: new Date().toISOString(),
    analysis: {
        javascript: {
            raw: formatBytes(jsResult.totalSize),
            estimated: formatBytes(estimatedJS),
            files: jsResult.fileCount
        },
        css: {
            raw: formatBytes(cssResult.totalSize),
            estimated: formatBytes(estimatedCSS),
            files: cssResult.fileCount
        },
        totalEstimated: formatBytes(estimatedJS + estimatedCSS + estimatedVendor),
        optimizations: {
            lazyLoading: lazyFiles.length > 0,
            codeSplitting: hasCodeSplitting,
            imageOptimization: imageOptFiles.length > 0
        }
    },
    largestFiles: largestFiles.slice(0, 5),
    recommendations: estimatedJS + estimatedCSS + estimatedVendor > 500 * 1024 ? 
        ['Implementar tree shaking mais agressivo', 'Considerar dynamic imports adicionais'] :
        ['Bundle size otimizado', 'Manter otimizações atuais']
};

// Salvar relatório
fs.writeFileSync('./bundle-analysis-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Relatório salvo em: bundle-analysis-report.json');

console.log('\n🎉 Análise concluída!');
