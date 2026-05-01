import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const otplib = require('otplib');
const qrcode = require('qrcode-terminal');

// A otplib v12+ exporta o authenticator como um objeto direto ou dentro de classes
// Vamos tentar capturar de qualquer forma que ela se apresente
const authenticator = otplib.authenticator;

let auth;
if (!authenticator) {
    console.log("Tentando carregar via classe...");
    const { Authenticator } = otplib;
    auth = new Authenticator();
} else {
    auth = authenticator;
}

const secret = auth.generateSecret();
const user = 'admingourmet@gourmetsaudavel.com'; 
const service = 'Gourmet Saudável - ADMIN';
const otpauth = auth.keyuri(user, service, secret);

console.log('\n' + '='.repeat(40));
console.log('🚀 GOURMET SAUDÁVEL - GERADOR DE CHAVE MESTRA');
console.log('='.repeat(40));
console.log('\n✅ SEGREDO MASTER (COPIE E GUARDE!):');
console.log(`\x1b[32m${secret}\x1b[0m`); 
console.log('\n📱 ESCANEIE O QR CODE ABAIXO:');
qrcode.generate(otpauth, { small: true });
console.log('\n⚠️  DELETE ESTE ARQUIVO APÓS O USO.\n');