#!/bin/bash

# Script de Deploy para Google Cloud App Engine + Neon Database
# Execute com: ./deploy.sh

set -e

echo "🚀 Deploy para Google Cloud App Engine + Neon Database"
echo "=================================================="

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK não encontrado. Instale primeiro:"
    echo "curl https://sdk.cloud.google.com | bash"
    exit 1
fi

# Verificar se está autenticado
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
    echo "❌ Não autenticado no Google Cloud. Execute:"
    echo "gcloud auth login"
    exit 1
fi

# Verificar se o projeto está configurado
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Projeto não configurado. Execute:"
    echo "gcloud config set project SEU_PROJECT_ID"
    exit 1
fi

echo "📦 Projeto: $PROJECT_ID"

# Verificar se app.yaml tem DATABASE_URL do Neon configurada
if grep -q "# DATABASE_URL" app.yaml; then
    echo ""
    echo "⚠️  CONFIGURAÇÃO NECESSÁRIA:"
    echo "   1. Crie conta gratuita no Neon: https://neon.tech"
    echo "   2. Crie novo database"
    echo "   3. Copie a string de conexão"
    echo "   4. Edite app.yaml e configure DATABASE_URL"
    echo ""
    echo "   Formato da string Neon:"
    echo "   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require"
    echo ""
    read -p "   Pressione Enter após configurar a DATABASE_URL no app.yaml..."
fi

# Verificar se App Engine existe
echo "🔍 Verificando App Engine..."
if ! gcloud app describe > /dev/null 2>&1; then
    echo "❌ App Engine não encontrado. Criando..."
    echo "   Regiões recomendadas:"
    echo "   - southamerica-east1 (São Paulo)"
    echo "   - us-central1 (Iowa)"
    
    read -p "   Digite a região [southamerica-east1]: " REGION
    REGION=${REGION:-southamerica-east1}
    
    gcloud app create --region=$REGION
    echo "✅ App Engine criado na região $REGION"
fi

# Verificar se tem dependências instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# Deploy no App Engine
echo "🚀 Fazendo deploy no App Engine..."
echo "   (Isso pode demorar alguns minutos...)"
gcloud app deploy --quiet

# Obter URL da aplicação
APP_URL=$(gcloud app browse --no-launch-browser 2>/dev/null || echo "https://$PROJECT_ID.uc.r.appspot.com")

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo "=================================================="
echo ""
echo "🌐 URL da aplicação: $APP_URL"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. 🔍 Verificar logs da aplicação:"
echo "   gcloud app logs tail -s default"
echo ""
echo "2. 🗄️  O banco Neon será configurado automaticamente"
echo "   (Tabelas criadas na primeira execução)"
echo ""
echo "3. 👤 Login inicial:"
echo "   Usuário: admin"
echo "   Senha: admin123"
echo ""
echo "4. 🌍 Domínio personalizado (opcional):"
echo "   gcloud app domain-mappings create seudominio.com"
echo ""
echo "💡 COMANDOS ÚTEIS:"
echo "• Ver logs: gcloud app logs tail -s default"
echo "• Ver versões: gcloud app versions list"
echo "• Rollback: gcloud app versions migrate VERSAO_ANTERIOR"
echo ""
echo "💰 CUSTOS:"
echo "• Neon Database: Gratuito (0.5GB)"
echo "• App Engine: Tier gratuito + ~R$0-150/mês"
echo ""
echo "✅ Aplicação deployada com sucesso!"