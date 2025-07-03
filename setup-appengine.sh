#!/bin/bash

# Configuração inicial para Google Cloud App Engine (sem Docker)
# Execute com: ./setup-appengine.sh

set -e

echo "🚀 Configuração Google Cloud App Engine + Neon Database"
echo "======================================================"

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK não encontrado!"
    echo ""
    echo "Instale primeiro:"
    echo "curl https://sdk.cloud.google.com | bash"
    echo "exec -l \$SHELL"
    exit 1
fi

# Fazer login
echo "🔐 Verificando autenticação..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
    echo "Fazendo login no Google Cloud..."
    gcloud auth login
fi

# Listar e configurar projeto
echo ""
echo "📋 Projetos disponíveis:"
gcloud projects list --format="table(projectId,name,projectNumber)"

echo ""
read -p "Digite o ID do seu projeto (ou pressione Enter para criar novo): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo ""
    read -p "Digite o ID para o novo projeto: " NEW_PROJECT_ID
    gcloud projects create $NEW_PROJECT_ID
    PROJECT_ID=$NEW_PROJECT_ID
    
    echo ""
    echo "⚠️  Configure o faturamento para o projeto $PROJECT_ID em:"
    echo "   https://console.cloud.google.com/billing"
    read -p "Pressione Enter após configurar o faturamento..."
fi

# Configurar projeto
gcloud config set project $PROJECT_ID
echo "✅ Projeto $PROJECT_ID configurado"

# Habilitar APIs
echo ""
echo "🔧 Habilitando APIs necessárias..."
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
echo "✅ APIs habilitadas"

# Verificar/criar App Engine
echo ""
echo "🌐 Configurando App Engine..."
if ! gcloud app describe > /dev/null 2>&1; then
    echo ""
    echo "Regiões recomendadas:"
    echo "  southamerica-east1 (São Paulo, Brasil)"
    echo "  us-central1 (Iowa, EUA)"
    echo "  us-east1 (Carolina do Sul, EUA)"
    
    read -p "Digite a região [southamerica-east1]: " REGION
    REGION=${REGION:-southamerica-east1}
    
    gcloud app create --region=$REGION
    echo "✅ App Engine criado na região $REGION"
else
    echo "✅ App Engine já configurado"
fi

echo ""
echo "🎉 Configuração básica concluída!"
echo "================================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. 🗄️  Configure banco Neon (gratuito):"
echo "   - Acesse: https://neon.tech"
echo "   - Crie conta e novo database"
echo "   - Copie string de conexão"
echo ""
echo "2. ⚙️  Configure app.yaml:"
echo "   - Edite o arquivo app.yaml"
echo "   - Descomente e configure DATABASE_URL"
echo "   - Formato: postgresql://user:pass@ep-xxx.aws.neon.tech/db?sslmode=require"
echo ""
echo "3. 🚀 Execute o deploy:"
echo "   ./deploy.sh"
echo ""
echo "💡 DICAS:"
echo "• O Neon oferece 0.5GB gratuito (suficiente para começar)"
echo "• App Engine tem tier gratuito generoso"
echo "• SSL é automático"
echo "• Auto-scaling incluído"
echo ""
echo "✅ Tudo pronto para configurar DATABASE_URL e fazer deploy!"