#!/bin/bash

# Script de Configuração Inicial para Google Cloud Platform
# Execute este script ANTES do deploy para configurar recursos necessários

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Configuração do Google Cloud Platform para Sistema de Vendas${NC}"
echo "============================================================"

# Verificar pré-requisitos
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud SDK não encontrado!${NC}"
    echo "Instale primeiro: curl https://sdk.cloud.google.com | bash"
    exit 1
fi

# Autenticação
echo -e "${YELLOW}🔐 Verificando autenticação...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
    echo "Fazendo login..."
    gcloud auth login
fi

# Configuração do projeto
echo -e "${YELLOW}📋 Configurando projeto...${NC}"
echo "Lista de projetos disponíveis:"
gcloud projects list

read -p "Digite o ID do seu projeto Google Cloud: " PROJECT_ID
gcloud config set project $PROJECT_ID

# Habilitar APIs necessárias
echo -e "${YELLOW}🔧 Habilitando APIs necessárias...${NC}"
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
echo -e "${GREEN}✅ APIs habilitadas${NC}"

# Verificar se App Engine já existe
echo -e "${YELLOW}🌐 Verificando App Engine...${NC}"
if ! gcloud app describe > /dev/null 2>&1; then
    echo "Criando aplicação App Engine..."
    echo "Regiões disponíveis:"
    echo "  us-central1 (Iowa, EUA)"
    echo "  southamerica-east1 (São Paulo, Brasil)"
    echo "  us-east1 (Carolina do Sul, EUA)"
    
    read -p "Digite a região desejada [us-central1]: " REGION
    REGION=${REGION:-us-central1}
    
    gcloud app create --region=$REGION
    echo -e "${GREEN}✅ App Engine criado na região $REGION${NC}"
else
    echo -e "${GREEN}✅ App Engine já existe${NC}"
fi

# Configuração do Cloud SQL
echo -e "${YELLOW}🗄️  Configurando banco de dados PostgreSQL...${NC}"
DB_INSTANCE_NAME="vendas-db"
DB_NAME="vendas"
DB_USER="vendas-user"

echo "Digite uma senha segura para o banco de dados:"
read -s DB_PASSWORD

echo "Criando instância Cloud SQL (isso pode demorar alguns minutos)..."

# Verificar se instância já existe
if ! gcloud sql instances describe $DB_INSTANCE_NAME > /dev/null 2>&1; then
    gcloud sql instances create $DB_INSTANCE_NAME \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-type=SSD \
        --storage-size=10GB \
        --backup-start-time=03:00
    
    echo -e "${GREEN}✅ Instância Cloud SQL criada${NC}"
else
    echo -e "${GREEN}✅ Instância Cloud SQL já existe${NC}"
fi

# Criar banco de dados
echo "Criando banco de dados..."
if ! gcloud sql databases describe $DB_NAME --instance=$DB_INSTANCE_NAME > /dev/null 2>&1; then
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME
    echo -e "${GREEN}✅ Banco de dados criado${NC}"
else
    echo -e "${GREEN}✅ Banco de dados já existe${NC}"
fi

# Criar usuário
echo "Criando usuário do banco..."
gcloud sql users create $DB_USER \
    --instance=$DB_INSTANCE_NAME \
    --password=$DB_PASSWORD > /dev/null 2>&1 || echo "Usuário já existe"

# Obter informações de conexão
echo -e "${YELLOW}📝 Obtendo informações de conexão...${NC}"
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")

# Gerar string de conexão
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"

echo ""
echo -e "${GREEN}🎉 Configuração concluída com sucesso!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📋 INFORMAÇÕES IMPORTANTES:${NC}"
echo ""
echo "🔗 String de conexão do banco:"
echo "$DATABASE_URL"
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "1. Copie a string de conexão acima"
echo "2. Edite o arquivo app.yaml"
echo "3. Descomente e configure a linha DATABASE_URL com a string acima"
echo "4. Execute: ./deploy.sh"
echo ""
echo -e "${YELLOW}📁 Exemplo para app.yaml:${NC}"
echo "env_variables:"
echo "  NODE_ENV: \"production\""
echo "  PORT: \"8080\""
echo "  DATABASE_URL: \"$DATABASE_URL\""
echo "  SESSION_SECRET: \"sua_chave_secreta_muito_segura_aqui_2024\""
echo ""
echo -e "${BLUE}💡 Comandos úteis:${NC}"
echo "• Ver logs: gcloud app logs tail -s default"
echo "• Conectar ao DB: gcloud sql connect $DB_INSTANCE_NAME --user=$DB_USER"
echo "• Status da app: gcloud app services list"
echo ""
echo "Salve essas informações em local seguro!"