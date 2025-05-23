#!/bin/bash

echo "🚀 CORRIGINDO NGINX - SOLUÇÃO DEFINITIVA"

# 1. Parar todos os processos PM2 problemáticos
echo "Parando processos PM2..."
pm2 stop all
pm2 delete all
sleep 3

# 2. Verificar se algo está na porta 5001
echo "Verificando porta 5001..."
sudo netstat -tlnp | grep 5001
sudo pkill -f "node.*5001" 2>/dev/null || true

# 3. Criar configuração Nginx correta
echo "Criando configuração Nginx definitiva..."
sudo tee /etc/nginx/sites-available/vendas-app > /dev/null << 'EOF'
server {
    listen 8080;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
EOF

# 4. Ativar site e testar configuração
sudo ln -sf /etc/nginx/sites-available/vendas-app /etc/nginx/sites-enabled/
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuração Nginx OK"
    sudo systemctl reload nginx
else
    echo "❌ Erro na configuração Nginx"
    exit 1
fi

# 5. Iniciar aplicação de forma estável
echo "Iniciando aplicação..."
cd /opt/vendas-app/nvs-antt2

# Criar arquivo de ambiente
echo 'DATABASE_URL="postgresql://nvsantt:nvs123@localhost:5432/vendas_db"' > .env

# Iniciar com PM2 de forma mais robusta
NODE_ENV=production DATABASE_URL="postgresql://nvsantt:nvs123@localhost:5432/vendas_db" pm2 start dist/index.js --name vendas-app-final --log-date-format="YYYY-MM-DD HH:mm:ss"

# 6. Aguardar inicialização
echo "Aguardando aplicação inicializar..."
sleep 10

# 7. Testar funcionamento
echo "Testando aplicação..."
curl -s http://localhost:5001 | head -5
echo ""
echo "Testando Nginx..."
curl -s http://localhost:8080 | head -5

echo ""
echo "🎯 SOLUÇÃO APLICADA! Teste agora: http://34.122.81.103:8080"
echo "Status da aplicação:"
pm2 status