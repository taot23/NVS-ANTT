#!/bin/bash

# Script de Deploy para Google Cloud Platform
# Execute com: ./deploy.sh

set -e

echo "🚀 Iniciando deploy para Google Cloud Platform..."

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

# Verificar se app.yaml tem DATABASE_URL configurada
if grep -q "# DATABASE_URL" app.yaml; then
    echo "⚠️  ATENÇÃO: Configure a DATABASE_URL no app.yaml antes do deploy!"
    echo "   Edite o arquivo app.yaml e descomente/configure a linha DATABASE_URL"
    read -p "   Pressione Enter após configurar a DATABASE_URL..."
fi

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# Deploy no App Engine
echo "🚀 Fazendo deploy no App Engine..."
gcloud app deploy --quiet

# Obter URL da aplicação
APP_URL=$(gcloud app browse --no-launch-browser)

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 URL da aplicação: $APP_URL"
echo ""
echo "📋 Próximos passos:"
echo "1. Execute as migrações do banco de dados:"
echo "   gcloud app logs tail -s default"
echo "   (Acesse a URL da aplicação e verifique se está funcionando)"
echo ""
echo "2. Configure o banco de dados se necessário:"
echo "   node migrate-production.js"
echo ""
echo "3. Configure domínio personalizado (opcional):"
echo "   gcloud app domain-mappings create seudominio.com"
echo ""
echo "🔍 Para monitorar logs:"
echo "   gcloud app logs tail -s default"
echo ""
echo "📊 Para ver métricas:"
echo "   gcloud app services list"