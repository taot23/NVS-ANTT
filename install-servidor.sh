#!/bin/bash

# Script de Instalação Automática - Servidor Debian/Ubuntu
# Execute com: bash install-servidor.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐧 Instalação Sistema de Vendas - Servidor Linux${NC}"
echo "=================================================="

# Verificar se é root/sudo
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ Não execute como root. Use um usuário com sudo.${NC}"
   exit 1
fi

# Verificar distribuição
if ! command -v apt &> /dev/null; then
    echo -e "${RED}❌ Este script é para Debian/Ubuntu apenas${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Configuração inicial...${NC}"

# Definir variáveis
APP_DIR="/var/www/vendas"
APP_PORT="8080"
APP_NAME="vendas-app"

echo "Diretório da aplicação: $APP_DIR"
echo "Porta da aplicação: $APP_PORT"

# Perguntar configurações
read -p "Pressione Enter para continuar ou Ctrl+C para cancelar..."

# 1. Atualizar sistema
echo -e "${YELLOW}🔄 Atualizando sistema...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependências básicas
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
sudo apt install -y curl wget git build-essential

# 3. Instalar Node.js 20
echo -e "${YELLOW}🟢 Instalando Node.js 20...${NC}"
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js $(node --version) instalado${NC}"
else
    echo -e "${GREEN}✅ Node.js já instalado: $(node --version)${NC}"
fi

# 4. Instalar PM2
echo -e "${YELLOW}⚙️  Instalando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 instalado${NC}"
else
    echo -e "${GREEN}✅ PM2 já instalado${NC}"
fi

# 5. Configurar diretório da aplicação
echo -e "${YELLOW}📁 Configurando diretório...${NC}"
if [ -d "$APP_DIR" ]; then
    echo -e "${YELLOW}⚠️  Diretório $APP_DIR já existe${NC}"
    read -p "Deseja sobrescrever? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo rm -rf $APP_DIR
    else
        echo -e "${RED}❌ Instalação cancelada${NC}"
        exit 1
    fi
fi

sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
echo -e "${GREEN}✅ Diretório criado: $APP_DIR${NC}"

# 6. Configurar banco de dados
echo -e "${YELLOW}🗄️  Configuração do banco de dados${NC}"
echo "Escolha uma opção:"
echo "1) PostgreSQL local"
echo "2) Banco Neon (gratuito, recomendado)"
read -p "Digite sua escolha (1 ou 2): " DB_CHOICE

DATABASE_URL=""

if [ "$DB_CHOICE" = "1" ]; then
    echo -e "${YELLOW}📦 Instalando PostgreSQL...${NC}"
    sudo apt install -y postgresql postgresql-contrib
    
    read -p "Digite a senha para o usuário do banco: " -s DB_PASSWORD
    echo
    
    sudo -u postgres psql -c "CREATE DATABASE vendas;"
    sudo -u postgres psql -c "CREATE USER vendas_user WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vendas TO vendas_user;"
    
    DATABASE_URL="postgresql://vendas_user:$DB_PASSWORD@localhost/vendas"
    echo -e "${GREEN}✅ PostgreSQL configurado${NC}"
    
elif [ "$DB_CHOICE" = "2" ]; then
    echo -e "${BLUE}📋 Configuração banco Neon:${NC}"
    echo "1. Acesse: https://neon.tech"
    echo "2. Crie conta gratuita"
    echo "3. Crie novo database" 
    echo "4. Copie a string de conexão"
    echo ""
    read -p "Cole a string de conexão do Neon: " DATABASE_URL
    echo -e "${GREEN}✅ Banco Neon configurado${NC}"
else
    echo -e "${RED}❌ Opção inválida${NC}"
    exit 1
fi

# 7. Gerar chave de sessão
SESSION_SECRET=$(openssl rand -base64 32)

# 8. Transferir código
echo -e "${YELLOW}📂 Como deseja transferir o código?${NC}"
echo "1) Git clone (recomendado)"
echo "2) Transferir via SCP manualmente"
read -p "Digite sua escolha (1 ou 2): " CODE_CHOICE

cd $APP_DIR

if [ "$CODE_CHOICE" = "1" ]; then
    read -p "URL do repositório Git: " GIT_URL
    git clone $GIT_URL .
    echo -e "${GREEN}✅ Código clonado via Git${NC}"
elif [ "$CODE_CHOICE" = "2" ]; then
    echo -e "${YELLOW}📋 Transfira os arquivos manualmente:${NC}"
    echo "scp -r projeto/* usuario@$(hostname -I | awk '{print $1}'):$APP_DIR/"
    read -p "Pressione Enter após transferir os arquivos..."
else
    echo -e "${RED}❌ Opção inválida${NC}"
    exit 1
fi

# 9. Instalar dependências do projeto
echo -e "${YELLOW}📦 Instalando dependências do projeto...${NC}"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
else
    echo -e "${RED}❌ package.json não encontrado${NC}"
    exit 1
fi

# 10. Criar arquivo de configuração
echo -e "${YELLOW}⚙️  Criando configuração...${NC}"
cat > .env.production << EOF
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=$DATABASE_URL
SESSION_SECRET=$SESSION_SECRET
EOF

# 11. Build da aplicação
echo -e "${YELLOW}🔨 Fazendo build...${NC}"
npm run build
echo -e "${GREEN}✅ Build concluído${NC}"

# 12. Criar configuração PM2
echo -e "${YELLOW}⚙️  Configurando PM2...${NC}"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: '$APP_NAME',
      script: 'dist/index.js',
      cwd: '$APP_DIR',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: $APP_PORT
      },
      env_file: '.env.production',
      log_file: '/var/log/$APP_NAME.log',
      error_file: '/var/log/$APP_NAME-error.log',
      out_file: '/var/log/$APP_NAME-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# 13. Iniciar aplicação
echo -e "${YELLOW}🚀 Iniciando aplicação...${NC}"
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 14. Configurar firewall
echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 22
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw allow $APP_PORT
    sudo ufw --force enable
    echo -e "${GREEN}✅ Firewall configurado${NC}"
fi

# 15. Instalar Nginx (opcional)
read -p "Deseja instalar Nginx como proxy reverso? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🌐 Instalando Nginx...${NC}"
    sudo apt install -y nginx
    
    read -p "Digite seu domínio (ou IP do servidor): " DOMAIN
    
    sudo tee /etc/nginx/sites-available/vendas > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    sudo ln -sf /etc/nginx/sites-available/vendas /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl restart nginx
    echo -e "${GREEN}✅ Nginx configurado${NC}"
fi

# Status final
echo ""
echo -e "${GREEN}🎉 Instalação concluída com sucesso!${NC}"
echo "========================================="
echo ""
echo -e "${BLUE}📋 Informações da instalação:${NC}"
echo "• Diretório: $APP_DIR"
echo "• Porta: $APP_PORT"
echo "• Status: $(pm2 describe $APP_NAME | grep status | awk '{print $4}')"
echo ""
echo -e "${BLUE}🌐 URLs de acesso:${NC}"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "• Via Nginx: http://$DOMAIN"
fi
echo "• Direto: http://$(hostname -I | awk '{print $1}'):$APP_PORT"
echo ""
echo -e "${BLUE}👤 Login inicial:${NC}"
echo "• Usuário: admin"
echo "• Senha: admin123"
echo ""
echo -e "${BLUE}💡 Comandos úteis:${NC}"
echo "• Ver status: pm2 status"
echo "• Ver logs: pm2 logs $APP_NAME"
echo "• Reiniciar: pm2 restart $APP_NAME"
echo "• Parar: pm2 stop $APP_NAME"
echo ""
echo -e "${GREEN}✅ Sistema pronto para uso!${NC}"