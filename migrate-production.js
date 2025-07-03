#!/usr/bin/env node

/**
 * Script de migração para produção no Google Cloud
 * Execute após o deploy para configurar o banco de dados
 */

import { Pool } from '@neondatabase/serverless';
import { createHash, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(createHash('scrypt'));

// Função para hash de senhas
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('scrypt');
  hash.update(password + salt);
  return `${hash.digest('hex')}.${salt}`;
}

async function createTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  console.log('🚀 Iniciando criação de tabelas...');
  
  try {
    // 1. Usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supervisor', 'operacional', 'vendedor', 'financeiro')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela users criada');

    // 2. Clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        document VARCHAR(50),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela customers criada');

    // 3. Métodos de pagamento
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela payment_methods criada');

    // 4. Tipos de serviço
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela service_types criada');

    // 5. Serviços
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        service_type_id INTEGER REFERENCES service_types(id),
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela services criada');

    // 6. Prestadores de serviço
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_providers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_info TEXT,
        specialty VARCHAR(255),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela service_providers criada');

    // 7. Vendas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(255) UNIQUE NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        customer_id INTEGER REFERENCES customers(id),
        payment_method_id INTEGER REFERENCES payment_methods(id),
        seller_id INTEGER REFERENCES users(id),
        service_type_id INTEGER REFERENCES service_types(id),
        service_provider_id INTEGER REFERENCES service_providers(id),
        total_amount DECIMAL(10,2) NOT NULL,
        installments INTEGER DEFAULT 1,
        installment_value DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'returned', 'corrected')),
        execution_status VARCHAR(50) DEFAULT 'waiting' CHECK (execution_status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
        financial_status VARCHAR(50) DEFAULT 'pending' CHECK (financial_status IN ('pending', 'paid', 'overdue', 'cancelled')),
        notes TEXT,
        return_reason TEXT,
        responsible_operational_id INTEGER REFERENCES users(id),
        responsible_financial_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela sales criada');

    // 8. Itens da venda
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        service_id INTEGER REFERENCES services(id),
        service_type_id INTEGER REFERENCES service_types(id),
        quantity INTEGER DEFAULT 1,
        price DECIMAL(10,2) DEFAULT 0,
        total_price DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela sale_items criada');

    // 9. Parcelas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sale_installments (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        installment_number INTEGER NOT NULL,
        due_date DATE NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        paid_date DATE,
        paid_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
        payment_method_id INTEGER REFERENCES payment_methods(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela sale_installments criada');

    // 10. Custos operacionais
    await pool.query(`
      CREATE TABLE IF NOT EXISTS operational_costs (
        id SERIAL PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(100),
        payment_date DATE,
        due_date DATE,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
        receipt_path VARCHAR(500),
        responsible_id INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela operational_costs criada');

    // 11. Histórico de status
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sales_status_history (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
        from_status VARCHAR(50),
        to_status VARCHAR(50),
        user_id INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela sales_status_history criada');

    // 12. Sessões
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);
    console.log('✅ Tabela session criada');

    console.log('🎉 Todas as tabelas foram criadas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function seedInitialData() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  console.log('🌱 Iniciando população de dados iniciais...');
  
  try {
    // Criar usuário admin
    const adminPassword = await hashPassword('admin123');
    await pool.query(`
      INSERT INTO users (username, password, role) 
      VALUES ('admin', $1, 'admin') 
      ON CONFLICT (username) DO NOTHING
    `, [adminPassword]);
    
    // Métodos de pagamento básicos
    await pool.query(`
      INSERT INTO payment_methods (name, description) VALUES 
      ('Dinheiro', 'Pagamento à vista em dinheiro'),
      ('PIX', 'Transferência instantânea via PIX'),
      ('Cartão de Crédito', 'Pagamento via cartão de crédito'),
      ('Cartão de Débito', 'Pagamento via cartão de débito'),
      ('Transferência Bancária', 'Transferência bancária')
      ON CONFLICT DO NOTHING
    `);
    
    // Tipos de serviço básicos
    await pool.query(`
      INSERT INTO service_types (name, category, description) VALUES 
      ('DETRAN', 'Documentação', 'Serviços relacionados ao DETRAN'),
      ('SINDICATO', 'Sindical', 'Serviços sindicais'),
      ('RECEITA FEDERAL', 'Fiscal', 'Serviços da Receita Federal'),
      ('INSS', 'Previdência', 'Serviços do INSS')
      ON CONFLICT DO NOTHING
    `);
    
    // Serviços básicos
    await pool.query(`
      INSERT INTO services (name, service_type_id, description) VALUES 
      ('CNH - Renovação', 1, 'Renovação de Carteira Nacional de Habilitação'),
      ('CRLV - Emissão', 1, 'Emissão de Certificado de Registro e Licenciamento de Veículo'),
      ('Sindical - Contribuição', 2, 'Pagamento de contribuição sindical'),
      ('CPF - Regularização', 3, 'Regularização de CPF'),
      ('INSS - Benefício', 4, 'Solicitação de benefício INSS')
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ Dados iniciais inseridos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados iniciais:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Iniciando migração para produção...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada!');
    process.exit(1);
  }
  
  try {
    await createTables();
    await seedInitialData();
    console.log('🎉 Migração concluída com sucesso!');
    console.log('👤 Usuário admin criado: admin/admin123');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}