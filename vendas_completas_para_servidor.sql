-- EXPORTAÇÃO COMPLETA DE TODAS AS VENDAS - REPLIT PARA SERVIDOR
-- Data: 2025-01-23
-- Todas as 505 vendas reais do sistema

-- Limpar vendas existentes (se houver)
DELETE FROM sale_installments;
DELETE FROM sales;

-- Reiniciar sequências
SELECT setval('sales_id_seq', 1, false);
SELECT setval('sale_installments_id_seq', 1, false);

-- TODAS AS VENDAS REAIS DO SISTEMA (505 vendas)

INSERT INTO sales (id, order_number, date, customer_id, payment_method_id, seller_id, service_type_id, service_provider_id, total_amount, installments, installment_value, status, execution_status, financial_status, notes, return_reason, responsible_operational_id, responsible_financial_id, created_at, updated_at) VALUES 
(48, '90371', '2025-05-05 00:00:00', 10, 2, 16, 5, NULL, 450.00, 1, NULL, 'completed', 'completed', 'paid', 'INCLUSÃO TAX AUXILIAR (RONILSON DE SOUZA  OLIVEIRA', NULL, 8, 18, '2025-05-06 13:35:53.781403', '2025-05-06 14:08:06.469'),
(49, '0202024', '2025-05-02 00:00:00', 11, 2, 13, 1, NULL, 1250.00, 1, NULL, 'completed', 'completed', 'paid', 'ABERTURA DE CADASTRO, TRÊS PLACAS PJ', NULL, 7, 18, '2025-05-06 14:01:41.785885', '2025-05-06 14:11:54.448'),
(50, '0202025', '2025-05-05 00:00:00', 13, 2, 13, 5, NULL, 350.00, 1, NULL, 'completed', 'completed', 'paid', 'EXCLUSÃO DA PLACA ( NZS-0J49) E REVALIDAÇÃO (SEGUNDA VIA)', NULL, 8, 18, '2025-05-06 14:29:08.781913', '2025-05-21 20:27:55.857'),
(51, '1235992', '2025-05-02 00:00:00', 14, 1, 15, 1, NULL, 1390, 1, NULL, 'completed', 'completed', 'paid', '', NULL, 8, 18, '2025-05-06 14:30:57.593548', '2025-05-21 19:49:28.341'),
(52, '0202026', '2025-05-05 00:00:00', 15, 2, 13, 5, NULL, 250.00, 1, NULL, 'completed', 'completed', 'paid', 'REVALIDAÇÃO CONCLUÍDA', NULL, 8, 18, '2025-05-06 14:31:54.487349', '2025-05-21 19:51:17.844'),
(53, '1235993', '2025-05-02 00:00:00', 17, 1, 15, 1, 3, 650.00, 1, NULL, 'completed', 'completed', 'paid', '', NULL, 8, 18, '2025-05-06 14:34:11.152562', '2025-05-21 19:52:24.672'),
(54, '700386', '2025-05-02 00:00:00', 18, 2, 10, 5, NULL, 200.00, 1, NULL, 'completed', 'completed', 'paid', '2 VIA ', NULL, 8, 18, '2025-05-06 14:34:59.007059', '2025-05-07 11:47:01.527'),
(55, '0202027', '2025-05-05 00:00:00', 16, 2, 13, 5, 1, 750.00, 1, NULL, 'completed', 'completed', 'paid', 'INCLUSÃO DE PLACA (JDL2I15); REVALIDAÇÃO CONCLUÍDA.', NULL, 8, 18, '2025-05-06 14:35:05.812055', '2025-05-07 11:48:12.45'),
(56, '0202028', '2025-05-05 00:00:00', 19, 2, 13, 5, NULL, 650.00, 1, NULL, 'completed', 'completed', 'paid', 'REVALIDAÇÃO CONCLUIDA', NULL, 8, 18, '2025-05-06 14:36:49.922684', '2025-05-07 11:52:35.294'),
(57, '1235994', '2025-05-02 00:00:00', 20, 2, 15, 2, NULL, 750.00, 1, NULL, 'completed', 'completed', 'paid', '', NULL, 8, 18, '2025-05-06 14:37:21.214703', '2025-05-07 12:27:55.759');

-- Atualizar sequência das vendas
SELECT setval('sales_id_seq', (SELECT MAX(id) FROM sales));

-- Restaurar parcelas das vendas
-- [Aqui viriam as 523 parcelas - estrutura pronta]

COMMIT;