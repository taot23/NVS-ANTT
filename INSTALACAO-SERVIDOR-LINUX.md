# 🐧 Instalação no Servidor Debian Linux

## Pré-requisitos

- Servidor Debian/Ubuntu com acesso root/sudo
- Porta 8080 liberada (ou outra de sua escolha)
- Acesso SSH ao servidor

## Passo 1: Preparar o Servidor

### 1.1 Conectar ao servidor
```bash
ssh usuario@seu-servidor-ip
```

### 1.2 Atualizar sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar Node.js 20
```bash
# Instalar Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version  # deve mostrar v20.x.x
npm --version
```

### 1.4 Instalar PM2 (gerenciador de processos)
```bash
sudo npm install -g pm2
```

### 1.5 Instalar Git (se não tiver)
```bash
sudo apt install git -y
```

## Passo 2: Configurar Banco de Dados

### Opção A: PostgreSQL Local
```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Configurar usuário e banco
sudo -u postgres psql
```

No PostgreSQL:
```sql
CREATE DATABASE vendas;
CREATE USER vendas_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE vendas TO vendas_user;
\q
```

### Opção B: Banco Neon (Recomendado)
1. Acesse https://neon.tech
2. Crie conta gratuita
3. Crie novo database
4. Copie string de conexão

## Passo 3: Transferir Aplicação

### 3.1 Criar diretório
```bash
sudo mkdir -p /var/www/vendas
sudo chown $USER:$USER /var/www/vendas
cd /var/www/vendas
```

### 3.2 Clonar/transferir código
```bash
# Se usando Git:
git clone SEU_REPOSITORIO .

# Ou transferir via SCP do seu computador:
# scp -r projeto/* usuario@servidor:/var/www/vendas/
```

### 3.3 Instalar dependências
```bash
npm install
```

## Passo 4: Configurar Variáveis de Ambiente

### 4.1 Criar arquivo .env
```bash
nano .env.production
```

### 4.2 Configurar variáveis:
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://vendas_user:sua_senha@localhost/vendas
# ou se usando Neon:
# DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require
SESSION_SECRET=sua_chave_secreta_muito_segura_aqui_2024
```

## Passo 5: Build da Aplicação

```bash
# Fazer build do frontend e backend
npm run build
```

## Passo 6: Configurar PM2

### 6.1 Criar arquivo de configuração PM2
```bash
nano ecosystem.config.js
```

### 6.2 Conteúdo do arquivo:
```javascript
module.exports = {
  apps: [
    {
      name: 'vendas-app',
      script: 'dist/index.js',
      cwd: '/var/www/vendas',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      env_file: '.env.production',
      log_file: '/var/log/vendas-app.log',
      error_file: '/var/log/vendas-app-error.log',
      out_file: '/var/log/vendas-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

### 6.3 Iniciar aplicação
```bash
# Iniciar com PM2
pm2 start ecosystem.config.js

# Configurar para iniciar no boot
pm2 startup
pm2 save
```

## Passo 7: Configurar Nginx (Opcional)

### 7.1 Instalar Nginx
```bash
sudo apt install nginx -y
```

### 7.2 Configurar site
```bash
sudo nano /etc/nginx/sites-available/vendas
```

### 7.3 Configuração Nginx:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;  # ou IP do servidor

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7.4 Ativar site
```bash
sudo ln -s /etc/nginx/sites-available/vendas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Passo 8: Configurar Firewall

```bash
# Liberar portas necessárias
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 8080  # Aplicação (se não usar Nginx)
sudo ufw enable
```

## Passo 9: SSL (Opcional com Certbot)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com
```

## Comandos Úteis

### Gerenciar aplicação
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs vendas-app

# Reiniciar
pm2 restart vendas-app

# Parar
pm2 stop vendas-app

# Atualizar aplicação
cd /var/www/vendas
git pull  # ou transfer novos arquivos
npm install
npm run build
pm2 restart vendas-app
```

### Monitoramento
```bash
# Ver uso de recursos
pm2 monit

# Ver logs em tempo real
pm2 logs --lines 100

# Status do sistema
htop
```

## Estrutura de Arquivos no Servidor

```
/var/www/vendas/
├── dist/                 # Aplicação buildada
├── client/              # Frontend (código)
├── server/              # Backend (código)
├── shared/              # Schemas
├── node_modules/        # Dependências
├── package.json
├── .env.production      # Variáveis de ambiente
├── ecosystem.config.js  # Configuração PM2
└── logs/               # Logs da aplicação
```

## URLs de Acesso

- **Com Nginx:** http://seu-dominio.com ou http://ip-do-servidor
- **Direto:** http://ip-do-servidor:8080

## Login Inicial

- **Usuário:** admin
- **Senha:** admin123

## Troubleshooting

### Aplicação não inicia
```bash
# Verificar logs
pm2 logs vendas-app

# Verificar se porta está disponível
netstat -tulpn | grep 8080

# Verificar configuração
pm2 describe vendas-app
```

### Erro de banco de dados
```bash
# Testar conexão PostgreSQL local
psql -U vendas_user -d vendas -h localhost

# Verificar logs da aplicação
tail -f /var/log/vendas-app-error.log
```

### Problemas de permissão
```bash
# Ajustar permissões
sudo chown -R $USER:$USER /var/www/vendas
chmod -R 755 /var/www/vendas
```

## Backup e Manutenção

### Backup do banco
```bash
# PostgreSQL local
pg_dump -U vendas_user vendas > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U vendas_user vendas < backup_20241203.sql
```

### Atualização da aplicação
```bash
cd /var/www/vendas
git pull
npm install
npm run build
pm2 restart vendas-app
```