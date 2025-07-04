#!/bin/bash

# Script de Atualização - Sistema de Vendas
# Execute com: bash atualizar-servidor.sh

set -e

# Configurações
APP_DIR="/var/www/vendas"
APP_NAME="vendas-app"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Atualizando Sistema de Vendas${NC}"
echo "=================================="

# Verificar se aplicação existe
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Diretório $APP_DIR não encontrado${NC}"
    exit 1
fi

cd $APP_DIR

# Fazer backup
echo -e "${YELLOW}💾 Criando backup...${NC}"
BACKUP_DIR="/tmp/vendas-backup-$(date +%Y%m%d_%H%M%S)"
cp -r $APP_DIR $BACKUP_DIR
echo -e "${GREEN}✅ Backup criado em: $BACKUP_DIR${NC}"

# Parar aplicação
echo -e "${YELLOW}⏸️  Parando aplicação...${NC}"
pm2 stop $APP_NAME || echo "Aplicação já parada"

# Atualizar código
echo -e "${YELLOW}📂 Atualizando código...${NC}"
if [ -d ".git" ]; then
    git pull
    echo -e "${GREEN}✅ Código atualizado via Git${NC}"
else
    echo -e "${YELLOW}⚠️  Atualize os arquivos manualmente e pressione Enter...${NC}"
    read
fi

# Instalar dependências
echo -e "${YELLOW}📦 Atualizando dependências...${NC}"
npm install

# Build
echo -e "${YELLOW}🔨 Fazendo build...${NC}"
npm run build

# Reiniciar aplicação
echo -e "${YELLOW}🚀 Reiniciando aplicação...${NC}"
pm2 start $APP_NAME

# Verificar status
echo -e "${YELLOW}🔍 Verificando status...${NC}"
sleep 3
pm2 status $APP_NAME

echo ""
echo -e "${GREEN}✅ Atualização concluída!${NC}"
echo "========================"
echo ""
echo "💡 Comandos úteis:"
echo "• Ver logs: pm2 logs $APP_NAME"
echo "• Status: pm2 status"
echo "• Monitorar: pm2 monit"