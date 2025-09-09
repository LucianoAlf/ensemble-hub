const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Pular loopback e interfaces não IPv4
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
}

function generateQRCode(url) {
  // ASCII QR Code placeholder - você pode usar uma lib real se quiser
  return `
  ████████████████████████████████
  ██                            ██
  ██  Escaneie para acessar:    ██
  ██                            ██
  ██  ${url.padEnd(24)}  ██
  ██                            ██
  ████████████████████████████████
  `;
}

const localIP = getLocalIP();
const port = process.env.PORT || 5173;
const urls = [
  `http://localhost:${port}`,
  `http://${localIP}:${port}`,
  `http://127.0.0.1:${port}`
];

console.log('\n🚀 ACESSO MOBILE CONFIGURADO!\n');
console.log('📱 URLs para acessar no mobile:\n');

urls.forEach((url, index) => {
  console.log(`${index + 1}. ${url}`);
});

console.log('\n📋 INSTRUÇÕES:\n');
console.log('1. Execute: npm run dev');
console.log('2. Conecte seu celular na mesma rede WiFi');
console.log(`3. Acesse: http://${localIP}:${port}`);
console.log('4. Teste as melhorias mobile implementadas!\n');

console.log('✨ FUNCIONALIDADES MOBILE TESTÁVEIS:\n');
console.log('• TransactionCard (substitui tabelas)');
console.log('• Modais adaptativos (drawers)');
console.log('• Gráficos otimizados (altura/touch)');
console.log('• Formulários responsivos\n');

if (localIP !== 'localhost') {
  console.log(generateQRCode(`http://${localIP}:${port}`));
}

console.log('🔧 TROUBLESHOOTING:\n');
console.log('• Firewall: Libere a porta 5173');
console.log('• WiFi: Mesmo nome de rede');
console.log('• IP: Pode mudar ao reconectar\n');
