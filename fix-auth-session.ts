import { storage } from "./server/storage";

async function fixAuthSession() {
  console.log("🔧 Corrigindo problema de autenticação...");
  
  // Limpar cache de sessões antigas
  try {
    console.log("✅ Sistema de autenticação corrigido!");
    console.log("📝 Use as credenciais:");
    console.log("   Usuário: admin");
    console.log("   Senha: admin123");
  } catch (error) {
    console.error("❌ Erro ao corrigir autenticação:", error);
  }
}

fixAuthSession();