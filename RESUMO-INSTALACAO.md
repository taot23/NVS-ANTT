# 📋 Resumo - Instalação no Servidor Linux

## 🚀 Instalação Automática (Recomendado)

### Passo 1: Baixar e executar script
```bash
# No seu servidor Linux:
wget https://raw.githubusercontent.com/SEU_REPO/install-servidor.sh
chmod +x install-servidor.sh
bash install-servidor.sh
```

**O script fará automaticamente:**
- ✅ Instalar Node.js 20
- ✅ Instalar PM2
- ✅ Configurar PostgreSQL ou Neon
- ✅ Fazer build da aplicação
- ✅ Configurar PM2 e auto-start
- ✅ Configurar firewall
- ✅ Instalar Nginx (opcional)

## 📁 Estrutura Final no Servidor

```
/var/www/vendas/
├── dist/                    # Aplicação buildada
├── .env.production         # Configurações
├── ecosystem.config.js     # PM2 config
├── package.json
└── logs/                   # Logs da aplicação
```

## 🌐 URLs de Acesso

- **Com Nginx:** http://seu-servidor.com
- **Direto:** http://ip-do-servidor:8080
- **Login:** admin / admin123

## ⚡ Comandos Úteis

```bash
# Status da aplicação
pm2 status

# Ver logs
pm2 logs vendas-app

# Reiniciar
pm2 restart vendas-app

# Atualizar aplicação
bash atualizar-servidor.sh

# Monitorar recursos
pm2 monit
```

## 🔧 Instalação Manual (Se preferir)

### 1. Preparar servidor
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2
```

### 2. Configurar diretório
```bash
sudo mkdir -p /var/www/vendas
sudo chown $USER:$USER /var/www/vendas
cd /var/www/vendas
```

### 3. Transferir código
```bash
# Via Git
git clone SEU_REPOSITORIO .

# Ou via SCP
# scp -r projeto/* usuario@servidor:/var/www/vendas/
```

### 4. Configurar banco
**Opção A - PostgreSQL Local:**
```bash
sudo apt install postgresql postgresql-contrib -y
sudo -u postgres psql
CREATE DATABASE vendas;
CREATE USER vendas_user WITH PASSWORD 'senha';
GRANT ALL PRIVILEGES ON DATABASE vendas TO vendas_user;
\q
```

**Opção B - Neon (Gratuito):**
- Criar conta em https://neon.tech
- Copiar string de conexão

### 5. Configurar ambiente
```bash
cat > .env.production << EOF
NODE_ENV=production
PORT=8080
DATABASE_URL=sua_string_de_conexao
SESSION_SECRET=chave_secreta_aleatoria
EOF
```

### 6. Build e iniciar
```bash
npm install
npm run build
pm2 start dist/index.js --name vendas-app
pm2 startup
pm2 save
```

## 🗄️ Opções de Banco

| Banco | Custo | Complexidade | Recomendação |
|-------|-------|--------------|--------------|
| **Neon** | Gratuito (0.5GB) | Simples | ⭐ Iniciantes |
| **PostgreSQL Local** | Gratuito | Médio | Servidores próprios |
| **Cloud SQL** | $25-100/mês | Médio | Produção enterprise |

## 🔒 Segurança

```bash
# Firewall básico
sudo ufw allow 22
sudo ufw allow 80  
sudo ufw allow 443
sudo ufw allow 8080
sudo ufw enable

# Certificado SSL (se usar domínio)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

## 📊 Monitoramento

```bash
# Logs em tempo real
pm2 logs vendas-app --lines 100

# Status detalhado  
pm2 describe vendas-app

# Reiniciar se travar
pm2 restart vendas-app

# Backup do banco
pg_dump vendas > backup_$(date +%Y%m%d).sql
```

## 🆘 Troubleshooting

### Aplicação não inicia
```bash
# Verificar logs
pm2 logs vendas-app

# Verificar porta
netstat -tulpn | grep 8080

# Reiniciar PM2
pm2 kill
pm2 start ecosystem.config.js
```

### Erro de banco
```bash
# Testar conexão
psql -U vendas_user -d vendas -h localhost

# Ver configuração
cat .env.production
```

### Problemas de permissão
```bash
sudo chown -R $USER:$USER /var/www/vendas
chmod -R 755 /var/www/vendas
```

## 💡 Dicas Importantes

1. **Porta 8080**: Configure diferente se 5050 já estiver em uso
2. **Backup**: Sempre faça backup antes de atualizar
3. **SSL**: Use Certbot para HTTPS gratuito
4. **Logs**: PM2 gera logs automáticos em `/var/log/`
5. **Updates**: Use `bash atualizar-servidor.sh` para atualizações

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs: `pm2 logs vendas-app`
2. Verificar status: `pm2 status`
3. Reiniciar: `pm2 restart vendas-app`
4. Último recurso: `pm2 kill` e reinstalar