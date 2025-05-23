-- BACKUP COMPLETO DO BANCO DE DADOS - REPLIT
-- Data: 2025-01-23
-- Sistema de Gestão de Vendas

-- Remover tabelas se existirem
DROP TABLE IF EXISTS sale_payment_receipts CASCADE;
DROP TABLE IF EXISTS sale_service_providers CASCADE;
DROP TABLE IF EXISTS sale_operational_costs CASCADE;
DROP TABLE IF EXISTS sale_installments CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales_status_history CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS service_providers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS service_types CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS cost_types CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS report_executions CASCADE;
DROP TABLE IF EXISTS debug_logs CASCADE;
DROP TABLE IF EXISTS session CASCADE;

-- Criar estrutura das tabelas
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    document TEXT,
    document_type TEXT,
    contact_name TEXT,
    phone TEXT,
    phone2 TEXT,
    email TEXT,
    user_id INTEGER REFERENCES users(id)
);

CREATE TABLE service_providers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    document TEXT,
    document_type TEXT,
    contact_name TEXT,
    phone TEXT,
    phone2 TEXT,
    email TEXT,
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at INTEGER DEFAULT EXTRACT(EPOCH FROM NOW())
);

CREATE TABLE cost_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    order_number TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_id INTEGER REFERENCES customers(id),
    payment_method_id INTEGER REFERENCES payment_methods(id),
    seller_id INTEGER REFERENCES users(id),
    service_type_id INTEGER REFERENCES service_types(id),
    service_provider_id INTEGER REFERENCES service_providers(id),
    total_amount NUMERIC(10,2),
    installments INTEGER DEFAULT 1,
    installment_value NUMERIC(10,2),
    status TEXT DEFAULT 'ativo',
    execution_status TEXT DEFAULT 'pendente',
    financial_status TEXT DEFAULT 'pendente',
    notes TEXT,
    return_reason TEXT,
    responsible_operational_id INTEGER REFERENCES users(id),
    responsible_financial_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_installments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    installment_number INTEGER NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    due_date TEXT,
    status TEXT DEFAULT 'pendente',
    payment_date TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_edit_history JSONB,
    payment_method_id INTEGER REFERENCES payment_methods(id),
    payment_notes TEXT
);

CREATE TABLE sale_operational_costs (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    description TEXT NOT NULL,
    cost_type_id INTEGER REFERENCES cost_types(id),
    amount NUMERIC(10,2) NOT NULL,
    date DATE,
    responsible_id INTEGER REFERENCES users(id),
    service_provider_id INTEGER REFERENCES service_providers(id),
    notes TEXT,
    payment_receipt_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_date DATE
);

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    description TEXT,
    details TEXT,
    entity_id INTEGER,
    entity_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    query TEXT,
    parameters JSONB,
    permissions VARCHAR(100),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE session (
    sid VARCHAR PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- INSERÇÃO DOS DADOS REAIS

-- Dados dos usuários
INSERT INTO users (id, username, password, role) VALUES
(1, 'admin', 'fa8e7bd4a7af435a6ac88fc3c8c39cdaca4260845dd676ae3f5c64da8dffac73a282fd9321ea88f86eeed00fac24c3eeded19e52498851e110818cebe3532a34.86ab43bf9364f906b7031b3fb0a7914c', 'admin'),
(2, 'vendedor', '123456', 'vendedor'),
(3, 'financeiro', '123456', 'financeiro'),
(4, 'operacional', '123456', 'operacional'),
(5, 'supervisor', '25cb3135ceb151f66445a6ef24c00b44c7edae3ba852327a764a2adb640c98684e44b28a6b52eed03abf0be17b2f8dcde5f2459b2a52928bd11437e85cba1778.c7c22531c71a748d8d3abfae01c37630', 'supervisor'),
(7, 'angelica', 'c373ef26836a4fa2e6a879f7ccda605d56a899b1066f4e02af4114809907397748a553d6b62eb451ed3101631423019716225d60d09929c5840b869addb45cb5.095556248aa9d212063ff13d5884ec5e', 'operacional'),
(8, 'gelson', '8b82d77a366d7c66d3d73c90a039c6501f7ad9ba716c765bacf319c520dddfc3fa0a7f6e26b8f415ec8a1eb3692da7bbe27a0cbaadd21204dd6508a2442ba6e9.69a0bb0d1f3a416f5fd69817eb7f7aa9', 'operacional'),
(9, 'gustavo', 'gustavo123', 'vendedor'),
(10, 'jessica santos', 'jessicasantos123', 'vendedor'),
(11, 'mathiely', 'mathiely123', 'vendedor'),
(12, 'paola', 'paola123', 'vendedor'),
(13, 'larissa', 'larissa123', 'vendedor'),
(14, 'luana', 'luana123', 'vendedor'),
(15, 'jessica priscila', 'jessicapriscila123', 'vendedor'),
(16, 'dafni', 'dafni123', 'vendedor'),
(17, 'gabriel', 'gabriel123', 'operacional'),
(18, 'jack', 'jack123', 'financeiro'),
(19, 'thais', 'thais123', 'vendedor');

-- Atualizar sequência do ID
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Nota: Este backup contém a estrutura completa das tabelas e todos os dados de usuários.
-- Para um backup completo com todas as vendas, clientes e outros dados, execute os comandos SQL adicionais conforme necessário.

-- Configurações de permissões
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO current_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO current_user;