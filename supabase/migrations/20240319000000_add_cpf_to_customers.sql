ALTER TABLE customers ADD COLUMN cpf text;
 
-- Adiciona uma restrição de formato para o CPF usando uma expressão regular
ALTER TABLE customers ADD CONSTRAINT cpf_format CHECK (cpf IS NULL OR cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$'); 